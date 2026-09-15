import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

function createDb() {
  const tursoUrl = process.env.TURSO_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    // Producao: usa Turso (SQLite na nuvem)
    console.log('[DB] Usando Turso (producao)');
    return createClient({ url: tursoUrl, authToken: tursoToken });
  }

  // Desenvolvimento: usa SQLite local
  const dbDir = process.env.DB_PATH || path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  console.log('[DB] Usando SQLite local');
  return createClient({ url: 'file:' + path.join(dbDir, 'screenshare.db') });
}

export const db = createDb();

export async function initDb() {
  const statements = [
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, avatar TEXT DEFAULT NULL, status TEXT DEFAULT 'offline', created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS friendships (id TEXT PRIMARY KEY, requester_id TEXT NOT NULL, addressee_id TEXT NOT NULL, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')), UNIQUE(requester_id, addressee_id))",
    "CREATE TABLE IF NOT EXISTS groups_table (id TEXT PRIMARY KEY, name TEXT NOT NULL, owner_id TEXT NOT NULL, invite_code TEXT UNIQUE NOT NULL, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS group_members (id TEXT PRIMARY KEY, group_id TEXT NOT NULL, user_id TEXT NOT NULL, joined_at TEXT DEFAULT (datetime('now')), UNIQUE(group_id, user_id))",
    "CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT, group_id TEXT, content TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))",
  ];
  for (const stmt of statements) {
    await db.execute(stmt);
  }
  console.log('[DB] Schema initialized');
}
