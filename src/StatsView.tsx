import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { clearAllData, getAllRecords, seedFakeData } from "./db";
import type { SleepRecord } from "./types";
import { useSwipe } from "./useSwipe";
import { binPoints } from "./binning";
import { MARK_COLOR, RECENCY_NEW, RECENCY_OLD, lerpColor } from "./colorScale";

const GRID_COLOR = "#71360033";
const TICK_COLOR = "#713600";
const TOOLTIP_STYLE = {
  background: "#FDFBD4",
  border: "1px solid #713600",
  borderRadius: 8,
  color: "#38240D",
  fontFamily: "Nunito, sans-serif",
  fontSize: 13,
};

interface Point {
  durationHours: number;
  sleepHour: number;
  wakeHour: number;
  rating: number;
  plotRating: number;
  timeMs: number;
  wakeTimeMs: number;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function toPoints(records: SleepRecord[]): Point[] {
  return records
    .filter((r) => r.wakeTime !== null && r.rating !== null)
    .map((r) => {
      const sleep = new Date(r.sleepTime);
      const wake = new Date(r.wakeTime as string);
      const durationHours = (wake.getTime() - sleep.getTime()) / 3_600_000;

      let sleepHour = sleep.getHours() + sleep.getMinutes() / 60;
      if (sleepHour < 12) sleepHour += 24;

      const wakeHour = wake.getHours() + wake.getMinutes() / 60;
      const rating = r.rating as number;
      const jitter = ((hashString(r.sleepTime) % 1000) / 1000 - 0.5) * 0.7;

      return {
        durationHours,
        sleepHour,
        wakeHour,
        rating,
        plotRating: rating + jitter,
        timeMs: sleep.getTime(),
        wakeTimeMs: wake.getTime(),
      };
    });
}

function hourLabel(value: unknown): string {
  const hour = Number(value);
  const h = Math.floor(hour) % 24;
  const m = Math.round((hour % 1) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

interface PointTooltipProps {
  active?: boolean;
  payload?: { payload: Point }[];
}

function PointTooltip({ active, payload }: PointTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{ ...TOOLTIP_STYLE, padding: "8px 12px", lineHeight: 1.6 }}>
      <div style={{ fontWeight: 700 }}>{formatDate(p.timeMs)}</div>
      <div>Bedtime: {formatClock(p.timeMs)}</div>
      <div>Wake-up: {formatClock(p.wakeTimeMs)}</div>
      <div>Duration: {p.durationHours.toFixed(1)}h</div>
      <div>Rating: {p.rating}/5</div>
    </div>
  );
}

const RANGE_PRESETS = [
  { label: "2W", days: 14 },
  { label: "1M", days: 30 },
  { label: "2M", days: 60 },
  { label: "6M", days: 180 },
  { label: "All", days: Infinity },
];

interface Dimension {
  key: "durationHours" | "sleepHour" | "wakeHour";
  title: string;
  tickFormatter?: (v: unknown) => string;
  binLabel: (lo: number, hi: number) => string;
}

const DIMENSIONS: Dimension[] = [
  {
    key: "durationHours",
    title: "Sleep duration vs. how you felt",
    binLabel: (lo, hi) => `${lo.toFixed(1)}–${hi.toFixed(1)}h`,
  },
  {
    key: "sleepHour",
    title: "Bedtime vs. how you felt",
    tickFormatter: hourLabel,
    binLabel: (lo, hi) => `${hourLabel(lo)}–${hourLabel(hi)}`,
  },
  {
    key: "wakeHour",
    title: "Wake-up time vs. how you felt",
    tickFormatter: hourLabel,
    binLabel: (lo, hi) => `${hourLabel(lo)}–${hourLabel(hi)}`,
  },
];

export function StatsView() {
  const [allPoints, setAllPoints] = useState<Point[] | null>(null);
  const [rangeIndex, setRangeIndex] = useState(2);
  const [rowIndex, setRowIndex] = useState(0);
  const [colIndex, setColIndex] = useState(0);
  const [hasSwipedUp, setHasSwipedUp] = useState(() => localStorage.getItem("sleeplog_swiped_up_v2") === "1");
  const [hasSwipedRight, setHasSwipedRight] = useState(() => localStorage.getItem("sleeplog_swiped_right_v2") === "1");

  function refresh() {
    getAllRecords().then((records) => setAllPoints(toPoints(records)));
  }

  useEffect(refresh, []);

  const rangeDays = RANGE_PRESETS[rangeIndex].days;
  const points = useMemo(() => {
    if (!allPoints) return null;
    if (!isFinite(rangeDays)) return allPoints;
    const cutoff = Date.now() - rangeDays * 24 * 3_600_000;
    return allPoints.filter((p) => p.timeMs >= cutoff);
  }, [allPoints, rangeDays]);

  // Swipe direction naming reflects the finger motion Recharts/the browser actually
  // reports; empirically the "aggregated" toggle matched swipeLeft, not swipeRight,
  // so the callback bodies are swapped here rather than in useSwipe's raw dx sign.
  const swipe = useSwipe({
    onSwipeUp: () => {
      setRowIndex((r) => Math.min(DIMENSIONS.length - 1, r + 1));
      localStorage.setItem("sleeplog_swiped_up_v2", "1");
      setHasSwipedUp(true);
    },
    onSwipeDown: () => setRowIndex((r) => Math.max(0, r - 1)),
    onSwipeLeft: () => {
      setColIndex((c) => Math.min(1, c + 1));
      localStorage.setItem("sleeplog_swiped_right_v2", "1");
      setHasSwipedRight(true);
    },
    onSwipeRight: () => setColIndex((c) => Math.max(0, c - 1)),
  });

  const testingTools = (
    <div className="testing-tools">
      <span>Testing tools:</span>
      <button
        onClick={async () => {
          await seedFakeData(60);
          refresh();
        }}
      >
        Seed 60 nights
      </button>
      <button
        onClick={async () => {
          await clearAllData();
          refresh();
        }}
      >
        Clear all data
      </button>
    </div>
  );

  if (points === null) return <div className="screen" />;

  if (points.length < 2) {
    return (
      <div className="screen">
        <p className="hint">Log a few more nights to see charts here.</p>
        {testingTools}
      </div>
    );
  }

  const dim = DIMENSIONS[rowIndex];
  const minTime = Math.min(...points.map((p) => p.timeMs));
  const maxTime = Math.max(...points.map((p) => p.timeMs));
  const timeSpan = maxTime - minTime || 1;

  const bins =
    colIndex === 1
      ? binPoints(
          points.map((p) => ({ x: p[dim.key], rating: p.rating })),
          6,
          dim.binLabel,
        )
      : [];

  return (
    <div className="stats">
      <div className="range-picker">
        {RANGE_PRESETS.map((preset, i) => (
          <button key={preset.label} className={i === rangeIndex ? "active" : ""} onClick={() => setRangeIndex(i)}>
            {preset.label}
          </button>
        ))}
      </div>
      {testingTools}

      <div className="chart-page" onTouchStart={swipe.onTouchStart} onTouchEnd={swipe.onTouchEnd}>
        <h3 className="chart-title">{dim.title}</h3>

        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            {colIndex === 0 ? (
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis
                  type="number"
                  dataKey={dim.key}
                  name={dim.title}
                  domain={["dataMin - 0.5", "dataMax + 0.5"]}
                  tickFormatter={dim.tickFormatter}
                  tick={{ fill: TICK_COLOR, fontSize: 12 }}
                  stroke={TICK_COLOR}
                />
                <YAxis
                  type="number"
                  dataKey="plotRating"
                  name="Rating"
                  domain={[0.6, 5.4]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fill: TICK_COLOR, fontSize: 12 }}
                  stroke={TICK_COLOR}
                />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<PointTooltip />} />
                <Scatter data={points}>
                  {points.map((p, i) => (
                    <Cell key={i} fill={lerpColor(RECENCY_OLD, RECENCY_NEW, (p.timeMs - minTime) / timeSpan)} />
                  ))}
                </Scatter>
              </ScatterChart>
            ) : (
              <BarChart data={bins} margin={{ top: 24, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: TICK_COLOR, fontSize: 11 }} stroke={TICK_COLOR} />
                <YAxis domain={[1, 5]} tick={{ fill: TICK_COLOR, fontSize: 12 }} stroke={TICK_COLOR} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: unknown) => Number(v).toFixed(2)} />
                <Bar dataKey="avgRating" fill={MARK_COLOR} radius={[6, 6, 0, 0]}>
                  <LabelList
                    dataKey="avgRating"
                    position="top"
                    formatter={(v: unknown) => Number(v).toFixed(1)}
                    style={{ fill: TICK_COLOR, fontSize: 12, fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {colIndex === 0 && <p className="chart-caption">lighter = older &middot; darker = more recent</p>}
        {colIndex === 1 && <p className="chart-caption">averaged over {bins.reduce((s, b) => s + b.count, 0)} nights</p>}

        {!hasSwipedUp && rowIndex < DIMENSIONS.length - 1 && (
          <p className="swipe-hint swipe-hint-bottom">swipe up for more &uarr;</p>
        )}
        {colIndex === 0 && !hasSwipedRight && <p className="swipe-hint swipe-hint-edge">swipe right for trends &rarr;</p>}

        <div className="page-dots">
          {DIMENSIONS.map((_, i) => (
            <span key={i} className={i === rowIndex ? "dot active" : "dot"} />
          ))}
        </div>
      </div>
    </div>
  );
}
