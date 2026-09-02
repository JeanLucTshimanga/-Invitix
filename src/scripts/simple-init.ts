import { config } from "dotenv";
config();

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const sqlite = new Database(databaseUrl.replace("file:", ""));
const db = drizzle(sqlite);

async function initDatabase() {
  console.log("Initializing SQLite database...");
  
  try {
    // Create tables
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        website TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'organizer',
        avatar TEXT,
        phone TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        reset_token TEXT,
        reset_token_expiry INTEGER,
        last_login_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
        created_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'other',
        description TEXT,
        date INTEGER NOT NULL,
        end_date INTEGER,
        location TEXT,
        address TEXT,
        cover_image TEXT,
        max_guests INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft',
        invitation_template INTEGER DEFAULT 1,
        custom_message TEXT,
        is_public INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS event_tables (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        table_number INTEGER NOT NULL,
        name TEXT,
        capacity INTEGER DEFAULT 8,
        notes TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS guests (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        table_id TEXT REFERENCES event_tables(id) ON DELETE SET NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        photo TEXT,
        category TEXT NOT NULL DEFAULT 'other',
        allowed_persons INTEGER DEFAULT 1,
        rsvp_status TEXT NOT NULL DEFAULT 'pending',
        is_present INTEGER NOT NULL DEFAULT 0,
        checked_in_at INTEGER,
        invitation_code TEXT NOT NULL UNIQUE,
        invitation_status TEXT NOT NULL DEFAULT 'not_sent',
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS qr_codes (
        id TEXT PRIMARY KEY,
        guest_id TEXT NOT NULL UNIQUE REFERENCES guests(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        qr_data TEXT,
        is_used INTEGER NOT NULL DEFAULT 0,
        used_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS checkins (
        id TEXT PRIMARY KEY,
        guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        checked_in_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        checked_in_at INTEGER NOT NULL,
        notes TEXT
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id TEXT PRIMARY KEY,
        event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        channel TEXT DEFAULT 'email',
        subject TEXT,
        body TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read INTEGER NOT NULL DEFAULT 0,
        metadata BLOB,
        created_at INTEGER NOT NULL
      )
    `);

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

initDatabase();