export interface Bin {
  label: string;
  avgRating: number;
  count: number;
}

export function binPoints(
  values: { x: number; rating: number }[],
  binWidth: number,
  formatLabel: (lo: number, hi: number) => string,
): Bin[] {
  if (values.length === 0) return [];

  const xs = values.map((v) => v.x);
  const start = Math.floor(Math.min(...xs) / binWidth) * binWidth;

  const buckets = new Map<number, { sum: number; count: number }>();
  for (const v of values) {
    const idx = Math.floor((v.x - start) / binWidth);
    const entry = buckets.get(idx) ?? { sum: 0, count: 0 };
    entry.sum += v.rating;
    entry.count += 1;
    buckets.set(idx, entry);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([idx, { sum, count }]) => ({
      label: formatLabel(start + idx * binWidth, start + (idx + 1) * binWidth),
      avgRating: sum / count,
      count,
    }));
}
