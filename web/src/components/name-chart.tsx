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
import { LATEST_YEAR } from "@/lib/dataset-meta";

export const PALETTE = [
  "#6c95ff", // cobalt
  "#e2789b", // rose
  "#e3b65e", // ambre
  "#5fc49a", // menthe
  "#a78ef5", // lavande
  "#7ecbe0", // glacier
];

interface ChartRow {
  year: number;
  [name: string]: number;
}

/** Clés auxiliaires portant la répartition garçons / filles d'une année. */
const boysKey = (name: string) => `${name}#b`;
const girlsKey = (name: string) => `${name}#g`;

interface TooltipEntry {
  dataKey?: unknown;
  color?: string;
  value?: unknown;
  payload?: ChartRow;
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
        row[boysKey(name)] = (row[boysKey(name)] ?? 0) + boys;
        row[girlsKey(name)] = (row[girlsKey(name)] ?? 0) + girls;
      }
    }
    return [...byYear.values()].sort((a, b) => a.year - b.year);
  }, [names, series]);

  // Prénoms portés par les deux sexes sur la période : détail dans l'infobulle.
  const mixed = useMemo(
    () =>
      new Set(
        names.filter((name) => {
          const rows = series[name] ?? [];
          return rows.some((r) => r[1] > 0) && rows.some((r) => r[2] > 0);
        })
      ),
    [names, series]
  );

  if (data.length === 0) return null;

  return (
    <figure className="rounded-xl border border-line bg-paper-deep/40 p-4 sm:p-6">
      <figcaption className="mb-4 flex items-baseline justify-between">
        <span className="font-display text-lg font-semibold">
          Naissances par année
        </span>
        <span className="text-xs uppercase tracking-widest text-ink-faint">
          1900 → {LATEST_YEAR}
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
            ticks={[1900, 1920, 1940, 1960, 1980, 2000, LATEST_YEAR]}
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
            content={({ active, payload, label }) => (
              <ChartTooltip
                active={active}
                payload={payload as TooltipEntry[] | undefined}
                label={label}
                mixed={mixed}
              />
            )}
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

function ChartTooltip({
  active,
  payload,
  label,
  mixed,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: unknown;
  mixed: Set<string>;
}) {
  if (!active || !payload?.length) return null;
  const fmt = (n: number) => n.toLocaleString("fr-FR");
  return (
    <div
      className="rounded-xl border border-line bg-paper-deep px-3 py-2 text-[13px]"
      style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}
    >
      <p className="mb-1 font-bold text-ink">{String(label)}</p>
      <ul className="space-y-1">
        {payload.map((entry) => {
          const name = String(entry.dataKey);
          const row = entry.payload;
          const boys = row?.[boysKey(name)] ?? 0;
          const girls = row?.[girlsKey(name)] ?? 0;
          return (
            <li key={name}>
              <span style={{ color: entry.color }}>
                {displayName(name)} : {fmt(Number(entry.value))}
              </span>
              {mixed.has(name) && (
                <span className="block text-xs tabular-nums text-ink-soft">
                  <span className="text-azur">{fmt(boys)} garçons</span>
                  {" · "}
                  <span className="text-blush">{fmt(girls)} filles</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
