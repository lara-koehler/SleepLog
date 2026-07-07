import type { SleepRecord } from "./types";

const HEADER = "sleepTime,wakeTime,rating";

export function recordsToCsv(records: SleepRecord[]): string {
  const rows = records.map((r) => `${r.sleepTime},${r.wakeTime ?? ""},${r.rating ?? ""}`);
  return [HEADER, ...rows].join("\n");
}

export function csvToRecords(text: string): Omit<SleepRecord, "id">[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines[0]?.trim() !== HEADER) {
    throw new Error("Unrecognized CSV format");
  }

  return lines
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [sleepTime, wakeTime, rating] = line.split(",");
      return {
        sleepTime,
        wakeTime: wakeTime ? wakeTime : null,
        rating: rating ? Number(rating) : null,
      };
    });
}

export function downloadCsv(csv: string): void {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sleeplog-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
