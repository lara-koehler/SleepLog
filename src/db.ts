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
