"use server";

import { db } from "@/db";
import { nameStats } from "@/db/schema";
import { like, eq, and, sql } from "drizzle-orm";

export async function searchNames(query: string) {
  if (!query || query.length < 2) return [];

  const upper = query.toUpperCase();
  const results = await db
    .selectDistinct({ name: nameStats.name, gender: nameStats.gender })
    .from(nameStats)
    .where(like(nameStats.name, `${upper}%`))
    .orderBy(nameStats.name)
    .limit(20);

  return results;
}

export async function getNameStats(name: string) {
  const results = await db
    .select({
      year: nameStats.year,
      count: nameStats.count,
      gender: nameStats.gender,
    })
    .from(nameStats)
    .where(eq(nameStats.name, name.toUpperCase()))
    .orderBy(nameStats.year);

  return results;
}

export async function getMultipleNameStats(names: string[]) {
  if (names.length === 0) return [];

  const upperNames = names.map((n) => n.toUpperCase());
  const results = await db
    .select({
      name: nameStats.name,
      year: nameStats.year,
      count: nameStats.count,
      gender: nameStats.gender,
    })
    .from(nameStats)
    .where(
      sql`${nameStats.name} IN ${upperNames}`
    )
    .orderBy(nameStats.name, nameStats.year);

  return results;
}
