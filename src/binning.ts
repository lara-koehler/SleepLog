export interface Bin {
  label: string;
  avgRating: number;
  count: number;
}

export function binPoints(
  values: { x: number; rating: number }[],
  binCount: number,
  formatLabel: (lo: number, hi: number) => string,
): Bin[] {
  if (values.length === 0) return [];

  const xs = values.map((v) => v.x);
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const span = max - min || 1;
  const width = span / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => ({
    sum: 0,
    count: 0,
    lo: min + i * width,
    hi: min + (i + 1) * width,
  }));

  for (const v of values) {
    let idx = Math.floor((v.x - min) / width);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    bins[idx].sum += v.rating;
    bins[idx].count += 1;
  }

  return bins
    .filter((b) => b.count > 0)
    .map((b) => ({
      label: formatLabel(b.lo, b.hi),
      avgRating: b.sum / b.count,
      count: b.count,
    }));
}
