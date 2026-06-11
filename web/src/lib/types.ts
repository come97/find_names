/** [année, garçons, filles] */
export type SeriesRow = [number, number, number];
export type NameSeries = Record<string, SeriesRow[]>;

/** Affichage : MARIE-JOSÉ → Marie-José */
export function displayName(name: string): string {
  return name
    .toLowerCase()
    .replace(/(^|[\s\-'])(\p{L})/gu, (_, sep, c) => sep + c.toUpperCase());
}

export interface NameStatsSummary {
  total: number;
  peakYear: number;
  peakCount: number;
  latestCount: number;
  boysShare: number; // 0..1
  firstYear: number;
}

export function summarize(rows: SeriesRow[]): NameStatsSummary {
  let total = 0;
  let boys = 0;
  let peakYear = rows[0]?.[0] ?? 0;
  let peakCount = 0;
  let latestCount = 0;
  for (const [year, b, g] of rows) {
    const n = b + g;
    total += n;
    boys += b;
    if (n > peakCount) {
      peakCount = n;
      peakYear = year;
    }
    if (year === 2022) latestCount = n;
  }
  return {
    total,
    peakYear,
    peakCount,
    latestCount,
    boysShare: total > 0 ? boys / total : 0,
    firstYear: rows[0]?.[0] ?? 0,
  };
}
