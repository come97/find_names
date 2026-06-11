import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { shardKey } from "./shard";
import type { NameSeries } from "./types";

const DATA_DIR = join(process.cwd(), "public", "data");

/** Charge les séries des prénoms demandés depuis les shards statiques. */
export async function loadSeries(names: string[]): Promise<NameSeries> {
  const wanted = names.map((n) => n.toUpperCase());
  const byShard = new Map<string, string[]>();
  for (const name of wanted) {
    const key = shardKey(name);
    byShard.set(key, [...(byShard.get(key) ?? []), name]);
  }

  const result: NameSeries = {};
  await Promise.all(
    [...byShard.entries()].map(async ([key, shardNames]) => {
      try {
        const raw = await readFile(join(DATA_DIR, "s", `${key}.json`), "utf8");
        const shard: NameSeries = JSON.parse(raw);
        for (const name of shardNames) {
          if (shard[name]) result[name] = shard[name];
        }
      } catch {
        // shard absent : prénom inconnu, on l'ignore
      }
    })
  );
  return result;
}

export async function loadSuggestions(): Promise<{
  recent: string[];
  classics: string[];
}> {
  const raw = await readFile(join(DATA_DIR, "top.json"), "utf8");
  return JSON.parse(raw);
}
