/**
 * Génère les données statiques à partir du fichier des prénoms INSEE
 * (nat2024.csv, format « sexe;prenom;periode;valeur »).
 *
 * Sorties dans public/data/ :
 *  - index.json : [name, total, genderFlag][] pour l'autocomplete client
 *    (genderFlag: 1 = garçon, 2 = fille, 3 = mixte)
 *  - top.json   : suggestions pour l'état vide (top récents + classiques)
 *  - s/{XX}.json: séries par bigramme normalisé du prénom
 *    { NAME: [[year, boys, girls], ...] }
 * Et src/lib/dataset-meta.ts (année la plus récente du jeu de données).
 *
 * Usage : npm run build:data
 */
import { createReadStream } from "node:fs";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "csv-parse";
import { shardKey } from "../src/lib/shard";

const CSV_PATH = join(__dirname, "../../nat2024.csv");
const OUT_DIR = join(__dirname, "../public/data");
const META_PATH = join(__dirname, "../src/lib/dataset-meta.ts");

type Series = Map<number, [number, number]>; // year -> [boys, girls]

async function main() {
  const byName = new Map<string, Series>();

  const parser = createReadStream(CSV_PATH).pipe(
    parse({ columns: true, trim: true, delimiter: ";" })
  );

  let latestYear = 0;
  for await (const row of parser) {
    const name = row.prenom as string;
    if (name === "_PRENOMS_RARES" || !/^\d{4}$/.test(row.periode)) continue;
    const year = Number(row.periode);
    const count = Number(row.valeur);
    const isBoy = row.sexe === "1";
    if (year > latestYear) latestYear = year;

    let series = byName.get(name);
    if (!series) {
      series = new Map();
      byName.set(name, series);
    }
    const entry = series.get(year) ?? [0, 0];
    entry[isBoy ? 0 : 1] += count;
    series.set(year, entry);
  }

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(join(OUT_DIR, "s"), { recursive: true });

  // Index pour l'autocomplete + shards de séries
  const index: [string, number, number][] = [];
  const shards = new Map<string, Record<string, number[][]>>();

  for (const [name, series] of byName) {
    let boys = 0;
    let girls = 0;
    const rows = [...series.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, [b, g]]) => {
        boys += b;
        girls += g;
        return [year, b, g];
      });

    const flag = boys > 0 && girls > 0 ? 3 : boys > 0 ? 1 : 2;
    index.push([name, boys + girls, flag]);

    const key = shardKey(name);
    let shard = shards.get(key);
    if (!shard) {
      shard = {};
      shards.set(key, shard);
    }
    shard[name] = rows;
  }

  index.sort((a, b) => b[1] - a[1]);
  await writeFile(join(OUT_DIR, "index.json"), JSON.stringify(index));

  for (const [key, shard] of shards) {
    await writeFile(join(OUT_DIR, "s", `${key}.json`), JSON.stringify(shard));
  }

  // Suggestions : top 12 de l'année la plus récente + classiques du siècle
  const recent = [...byName.entries()]
    .map(([name, s]) => {
      const e = s.get(latestYear);
      return [name, e ? e[0] + e[1] : 0] as const;
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name]) => name);
  const classics = index.slice(0, 12).map(([name]) => name);
  await writeFile(
    join(OUT_DIR, "top.json"),
    JSON.stringify({ recent, classics })
  );

  await writeFile(
    META_PATH,
    `// Généré par scripts/build-data.ts — ne pas modifier à la main\nexport const LATEST_YEAR = ${latestYear};\n`
  );

  console.log(
    `OK — ${index.length} prénoms, ${shards.size} shards, données jusqu'en ${latestYear}`
  );
}

main();
