import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

const sqlite = new Database('sqlite.db');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');
export const db = drizzle(sqlite, { schema });
