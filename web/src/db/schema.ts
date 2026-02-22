import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const nameStats = sqliteTable(
  "name_stats",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    gender: integer("gender").notNull(), // 1 = Garçon, 2 = Fille
    year: integer("year").notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [
    index("idx_name_stats_name").on(table.name),
    index("idx_name_stats_gender_name").on(table.gender, table.name),
    index("idx_name_stats_name_year").on(table.name, table.year),
  ]
);
