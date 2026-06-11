"use client";

import { normalizeForSearch } from "./shard";

/** [prénom, total naissances, genre (1 garçon, 2 fille, 3 mixte)] */
export type IndexEntry = [string, number, number];

let indexPromise: Promise<IndexEntry[]> | null = null;
let normalized: string[] | null = null;

/** Charge l'index une seule fois (≈150 Ko gzippé, mis en cache navigateur). */
export function loadNamesIndex(): Promise<IndexEntry[]> {
  if (!indexPromise) {
    indexPromise = fetch("/data/index.json")
      .then((r) => r.json())
      .then((entries: IndexEntry[]) => {
        normalized = entries.map(([name]) => normalizeForSearch(name));
        return entries;
      });
  }
  return indexPromise;
}

/**
 * Recherche instantanée, insensible aux accents. L'index est trié par
 * popularité : les préfixes exacts sortent en premier, puis les inclusions.
 */
export function searchIndex(
  entries: IndexEntry[],
  query: string,
  limit = 12
): IndexEntry[] {
  if (!normalized) return [];
  const q = normalizeForSearch(query.trim());
  if (q.length < 2) return [];

  const prefix: IndexEntry[] = [];
  const contains: IndexEntry[] = [];
  for (let i = 0; i < entries.length; i++) {
    const n = normalized[i];
    if (n.startsWith(q)) {
      prefix.push(entries[i]);
      if (prefix.length >= limit) break;
    } else if (contains.length < limit && n.includes(q)) {
      contains.push(entries[i]);
    }
  }
  return [...prefix, ...contains].slice(0, limit);
}

/** Tire un prénom au hasard, pondéré vers les prénoms connus mais variés. */
export function randomName(entries: IndexEntry[]): string {
  // Parmi les 3000 plus donnés pour rester découvrable sans être obscur
  const pool = Math.min(3000, entries.length);
  return entries[Math.floor(Math.random() * pool)][0];
}
