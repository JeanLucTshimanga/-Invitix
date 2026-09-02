import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema-sqlite";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsSqliteDb?: Database;
};

export const sqlite =
  globalForDb.__arenaNextJsSqliteDb ??
  new Database(databaseUrl.replace("file:", ""));

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsSqliteDb = sqlite;
}

export const db = drizzle(sqlite, { schema });
