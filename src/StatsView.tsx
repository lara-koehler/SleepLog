import { useEffect, useState } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAllRecords } from "./db";
import type { SleepRecord } from "./types";

const MARK_COLOR = "#C05800";
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

      return { durationHours, sleepHour, wakeHour, rating: r.rating as number };
    });
}

function hourLabel(value: unknown): string {
  const hour = Number(value);
  const h = Math.floor(hour) % 24;
  const m = Math.round((hour % 1) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function StatsView() {
  const [points, setPoints] = useState<Point[] | null>(null);

  useEffect(() => {
    getAllRecords().then((records) => setPoints(toPoints(records)));
  }, []);

  if (points === null) return <div className="screen" />;

  if (points.length < 2) {
    return (
      <div className="screen">
        <p className="hint">Log a few more nights to see charts here.</p>
      </div>
    );
  }

  return (
    <div className="stats">
      <section>
        <h3>Sleep duration vs. how you felt</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis
              type="number"
              dataKey="durationHours"
              name="Duration"
              unit="h"
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
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
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: unknown) => Number(v).toFixed(1)}
            />
            <Scatter data={points} fill={MARK_COLOR} />
          </ScatterChart>
        </ResponsiveContainer>
      </section>

      <section>
        <h3>Bedtime vs. how you felt</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis
              type="number"
              dataKey="sleepHour"
              name="Bedtime"
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
              tickFormatter={hourLabel}
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
            <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={TOOLTIP_STYLE} labelFormatter={hourLabel} />
            <Scatter data={points} fill={MARK_COLOR} />
          </ScatterChart>
        </ResponsiveContainer>
      </section>

      <section>
        <h3>Wake-up time vs. how you felt</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis
              type="number"
              dataKey="wakeHour"
              name="Wake-up"
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
              tickFormatter={hourLabel}
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
            <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={TOOLTIP_STYLE} labelFormatter={hourLabel} />
            <Scatter data={points} fill={MARK_COLOR} />
          </ScatterChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
