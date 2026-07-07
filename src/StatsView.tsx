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
  timeMs: number;
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

      return { durationHours, sleepHour, wakeHour, rating: r.rating as number, timeMs: sleep.getTime() };
    });
}

function hourLabel(value: unknown): string {
  const hour = Number(value);
  const h = Math.floor(hour) % 24;
  const m = Math.round((hour % 1) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

const RANGE_PRESETS = [
  { label: "2W", days: 14 },
  { label: "1M", days: 30 },
  { label: "2M", days: 60 },
  { label: "6M", days: 180 },
  { label: "All", days: Infinity },
];

interface Dimension {
  key: "sleepHour" | "wakeHour" | "durationHours";
  title: string;
  tickFormatter?: (v: unknown) => string;
  binLabel: (lo: number, hi: number) => string;
}

const DIMENSIONS: Dimension[] = [
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
  {
    key: "durationHours",
    title: "Sleep duration vs. how you felt",
    binLabel: (lo, hi) => `${lo.toFixed(1)}–${hi.toFixed(1)}h`,
  },
];

export function StatsView() {
  const [allPoints, setAllPoints] = useState<Point[] | null>(null);
  const [rangeIndex, setRangeIndex] = useState(2);
  const [rowIndex, setRowIndex] = useState(0);
  const [colIndex, setColIndex] = useState(0);
  const [hasSwipedDown, setHasSwipedDown] = useState(() => localStorage.getItem("sleeplog_swiped_down") === "1");
  const [hasSwipedRight, setHasSwipedRight] = useState(() => localStorage.getItem("sleeplog_swiped_right") === "1");

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

  const swipe = useSwipe({
    onSwipeDown: () => {
      setRowIndex((r) => Math.min(DIMENSIONS.length - 1, r + 1));
      localStorage.setItem("sleeplog_swiped_down", "1");
      setHasSwipedDown(true);
    },
    onSwipeUp: () => setRowIndex((r) => Math.max(0, r - 1)),
    onSwipeRight: () => {
      setColIndex((c) => Math.min(1, c + 1));
      localStorage.setItem("sleeplog_swiped_right", "1");
      setHasSwipedRight(true);
    },
    onSwipeLeft: () => setColIndex((c) => Math.max(0, c - 1)),
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
                  dataKey="rating"
                  name="Rating"
                  domain={[1, 5]}
                  allowDecimals={false}
                  tick={{ fill: TICK_COLOR, fontSize: 12 }}
                  stroke={TICK_COLOR}
                />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={TOOLTIP_STYLE} labelFormatter={dim.tickFormatter} />
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

        {!hasSwipedDown && rowIndex < DIMENSIONS.length - 1 && (
          <p className="swipe-hint swipe-hint-down">swipe down for more &darr;</p>
        )}
        {colIndex === 0 && !hasSwipedRight && <p className="swipe-hint swipe-hint-right">swipe right for trends &rarr;</p>}

        <div className="page-dots">
          {DIMENSIONS.map((_, i) => (
            <span key={i} className={i === rowIndex ? "dot active" : "dot"} />
          ))}
        </div>
      </div>
    </div>
  );
}
