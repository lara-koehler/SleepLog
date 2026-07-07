import { openDB, type DBSchema } from "idb";
import type { SleepRecord } from "./types";

interface SleepDB extends DBSchema {
  sleepRecords: {
    key: number;
    value: SleepRecord;
  };
}

const dbPromise = openDB<SleepDB>("sleep-tracker", 1, {
  upgrade(db) {
    db.createObjectStore("sleepRecords", { keyPath: "id", autoIncrement: true });
  },
});

export async function getAllRecords(): Promise<SleepRecord[]> {
  const db = await dbPromise;
  const records = await db.getAll("sleepRecords");
  return records.sort((a, b) => a.sleepTime.localeCompare(b.sleepTime));
}

export async function getActiveRecord(): Promise<SleepRecord | undefined> {
  const records = await getAllRecords();
  return records.find((r) => r.rating === null);
}

export async function startSleep(): Promise<SleepRecord> {
  const db = await dbPromise;
  const record: Omit<SleepRecord, "id"> = {
    sleepTime: new Date().toISOString(),
    wakeTime: null,
    rating: null,
  };
  const id = await db.add("sleepRecords", record as SleepRecord);
  return { ...record, id } as SleepRecord;
}

export async function recordWake(id: number): Promise<void> {
  const db = await dbPromise;
  const record = await db.get("sleepRecords", id);
  if (!record) return;
  record.wakeTime = new Date().toISOString();
  await db.put("sleepRecords", record);
}

export async function recordRating(id: number, rating: number): Promise<void> {
  const db = await dbPromise;
  const record = await db.get("sleepRecords", id);
  if (!record) return;
  record.rating = rating;
  await db.put("sleepRecords", record);
}

export async function deleteRecord(id: number): Promise<void> {
  const db = await dbPromise;
  await db.delete("sleepRecords", id);
}

export async function clearAllData(): Promise<void> {
  const db = await dbPromise;
  await db.clear("sleepRecords");
}

export async function addRecords(records: Omit<SleepRecord, "id">[]): Promise<void> {
  const db = await dbPromise;
  const tx = db.transaction("sleepRecords", "readwrite");
  for (const record of records) {
    await tx.store.add(record as SleepRecord);
  }
  await tx.done;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export async function seedFakeData(nights = 60): Promise<void> {
  const db = await dbPromise;
  const now = new Date();

  for (let i = nights; i >= 1; i--) {
    const bedtimeHour = (randomBetween(22, 24.5) + randomBetween(22, 24.5)) / 2;
    const durationHours = (randomBetween(5.5, 9) + randomBetween(5.5, 9)) / 2;

    const sleepDate = new Date(now);
    sleepDate.setDate(sleepDate.getDate() - i);
    sleepDate.setHours(0, 0, 0, 0);
    sleepDate.setTime(sleepDate.getTime() + bedtimeHour * 3_600_000);

    const wakeDate = new Date(sleepDate.getTime() + durationHours * 3_600_000);

    const durationPenalty = Math.abs(durationHours - 7.5) * 0.7;
    const bedtimePenalty = bedtimeHour > 24.5 ? (bedtimeHour - 24.5) * 0.8 : 0;
    const noise = randomBetween(-0.6, 0.6);
    const rating = Math.max(1, Math.min(5, Math.round(4.7 - durationPenalty - bedtimePenalty + noise)));

    const record: Omit<SleepRecord, "id"> = {
      sleepTime: sleepDate.toISOString(),
      wakeTime: wakeDate.toISOString(),
      rating,
    };
    await db.add("sleepRecords", record as SleepRecord);
  }
}
