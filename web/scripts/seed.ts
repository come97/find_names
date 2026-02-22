import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { parse } from "csv-parse/sync";
import * as fs from "node:fs";
import * as path from "node:path";
import "dotenv/config";
import { nameStats } from "../src/db/schema";
import { sql } from "drizzle-orm";

const BATCH_SIZE = 500;
const CSV_PATH = path.resolve(__dirname, "../../nat2022.csv");

interface CsvRow {
  sexe: string;
  preusuel: string;
  annais: string;
  nombre: string;
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    console.error("Missing TURSO_DATABASE_URL in .env.local");
    process.exit(1);
  }

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client);

  // Create table if not exists
  await client.execute(`
    CREATE TABLE IF NOT EXISTS name_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender INTEGER NOT NULL,
      year INTEGER NOT NULL,
      count INTEGER NOT NULL DEFAULT 0
    )
  `);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_name_stats_name ON name_stats (name)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_name_stats_gender_name ON name_stats (gender, name)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_name_stats_name_year ON name_stats (name, year)`);
  await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_name_stats_unique ON name_stats (name, gender, year)`);

  console.log(`Reading CSV from ${CSV_PATH}...`);
  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const records: CsvRow[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
  });

  const rows = records
    .filter((r) => r.preusuel !== "_PRENOMS_RARES")
    .filter((r) => !isNaN(Number(r.annais)))
    .map((r) => ({
      name: r.preusuel,
      gender: Number(r.sexe),
      year: Number(r.annais),
      count: Number(r.nombre),
    }));

  console.log(`Parsed ${rows.length} rows (after filtering). Inserting...`);

  // Clear existing data for idempotent re-runs
  await db.delete(nameStats);

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db.insert(nameStats).values(batch);

    inserted += batch.length;
    if (inserted % 50000 === 0 || inserted === rows.length) {
      console.log(`  ${inserted} / ${rows.length} rows inserted`);
    }
  }

  console.log("Seed complete.");
  client.close();
}

main().catch(console.error);
