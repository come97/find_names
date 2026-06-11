"use client";

import { shardKey } from "./shard";
import type { NameSeries, SeriesRow } from "./types";

const cache = new Map<string, SeriesRow[]>();
const shardPromises = new Map<string, Promise<NameSeries>>();

export function primeSeriesCache(series: NameSeries) {
  for (const [name, rows] of Object.entries(series)) {
    cache.set(name, rows);
  }
}

/** Récupère les séries manquantes depuis les shards CDN, avec cache mémoire. */
export async function fetchSeries(names: string[]): Promise<NameSeries> {
  const wanted = names.map((n) => n.toUpperCase());
  const missing = wanted.filter((n) => !cache.has(n));

  const keys = [...new Set(missing.map(shardKey))];
  await Promise.all(
    keys.map((key) => {
      let p = shardPromises.get(key);
      if (!p) {
        p = fetch(`/data/s/${key}.json`)
          .then((r) => (r.ok ? r.json() : {}))
          .catch(() => ({}));
        shardPromises.set(key, p);
      }
      return p.then((shard: NameSeries) => {
        for (const name of missing) {
          if (shardKey(name) === key && shard[name]) {
            cache.set(name, shard[name]);
          }
        }
      });
    })
  );

  const result: NameSeries = {};
  for (const name of wanted) {
    const rows = cache.get(name);
    if (rows) result[name] = rows;
  }
  return result;
}
