import { useEffect, useState } from "react";
import { deleteRecord, getActiveRecord, recordRating, recordWake, startSleep } from "./db";
import type { SleepRecord } from "./types";
import { MoonIcon, SunIcon } from "./icons";

const MIN_DURATION_MS = 5 * 60 * 1000;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function LogScreen() {
  const [active, setActive] = useState<SleepRecord | null | undefined>(undefined);

  useEffect(() => {
    getActiveRecord().then((r) => setActive(r ?? null));
  }, []);

  if (active === undefined) {
    return <div className="screen" />;
  }

  if (active === null) {
    return (
      <div className="screen">
        <button
          className="big-button sleep"
          onClick={async () => {
            const record = await startSleep();
            setActive(record);
          }}
        >
          <MoonIcon size={36} />
          Going to sleep
        </button>
      </div>
    );
  }

  if (active.wakeTime === null) {
    return (
      <div className="screen">
        <p className="hint">Asleep since {formatTime(active.sleepTime)}</p>
        <button
          className="big-button wake"
          onClick={async () => {
            const wakeTime = new Date();
            const elapsed = wakeTime.getTime() - new Date(active.sleepTime).getTime();

            if (elapsed < MIN_DURATION_MS) {
              await deleteRecord(active.id);
              setActive(null);
              return;
            }

            await recordWake(active.id);
            setActive({ ...active, wakeTime: wakeTime.toISOString() });
          }}
        >
          <SunIcon size={36} />
          I'm awake
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <p className="rating-question">How do you feel?</p>
      <div className="rating-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className="rating-button"
            onClick={async () => {
              await recordRating(active.id, n);
              setActive(null);
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
