"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { displayName, type NameSeries } from "@/lib/types";

export const PALETTE = [
  "#e2553d", // vermillon
  "#3d6fb4", // azur
  "#d9a441", // or
  "#6f9d87", // sauge
  "#8a5a83", // prune
  "#1e2a45", // encre
];

interface ChartRow {
  year: number;
  [name: string]: number;
}

export function NameChart({
  names,
  series,
}: {
  names: string[];
  series: NameSeries;
}) {
  const data = useMemo(() => {
    const byYear = new Map<number, ChartRow>();
    for (const name of names) {
      for (const [year, boys, girls] of series[name] ?? []) {
        let row = byYear.get(year);
        if (!row) {
          row = { year };
          byYear.set(year, row);
        }
        row[name] = (row[name] ?? 0) + boys + girls;
      }
    }
    return [...byYear.values()].sort((a, b) => a.year - b.year);
  }, [names, series]);

  if (data.length === 0) return null;

  return (
    <figure className="rounded-xl border border-line bg-paper-deep/40 p-4 sm:p-6">
      <figcaption className="mb-4 flex items-baseline justify-between">
        <span className="font-display text-lg font-semibold">
          Naissances par année
        </span>
        <span className="text-xs uppercase tracking-widest text-ink-faint">
          1900 → 2022
        </span>
      </figcaption>
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="var(--color-ink-faint)"
            tick={{ fill: "var(--color-ink-soft)", fontSize: 12 }}
            tickLine={false}
            ticks={[1900, 1920, 1940, 1960, 1980, 2000, 2022]}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: "var(--color-ink-soft)", fontSize: 12 }}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toLocaleString("fr-FR")} k` : `${v}`
            }
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-paper)",
              border: "2px solid var(--color-ink)",
              borderRadius: 12,
              fontSize: 13,
              boxShadow: "3px 3px 0 0 var(--color-ink)",
            }}
            labelStyle={{ fontWeight: 700, color: "var(--color-ink)" }}
            formatter={(value, key) => [
              Number(value).toLocaleString("fr-FR"),
              displayName(String(key)),
            ]}
            isAnimationActive={false}
          />
          {names.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              animationDuration={400}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
