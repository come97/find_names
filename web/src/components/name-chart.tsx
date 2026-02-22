"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getMultipleNameStats } from "@/app/actions/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(340, 75%, 55%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(173, 80%, 40%)",
  "hsl(0, 84%, 60%)",
  "hsl(47, 96%, 53%)",
];

interface ChartRow {
  year: number;
  [key: string]: number;
}

export function NameChart({ names }: { names: string[] }) {
  const [data, setData] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (names.length === 0) {
      setData([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getMultipleNameStats(names).then((rows) => {
      if (cancelled) return;

      // Pivot: group by year, sum counts per name (across genders)
      const byYear = new Map<number, ChartRow>();
      for (const row of rows) {
        if (!byYear.has(row.year)) {
          byYear.set(row.year, { year: row.year });
        }
        const entry = byYear.get(row.year)!;
        entry[row.name] = (entry[row.name] || 0) + row.count;
      }

      const sorted = Array.from(byYear.values()).sort(
        (a, b) => a.year - b.year
      );
      setData(sorted);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [names]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">Chargement...</span>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Évolution des naissances
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            {names.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
