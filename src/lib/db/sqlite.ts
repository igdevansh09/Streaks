import * as SQLite from 'expo-sqlite';

const DB_NAME = 'streaks_habits.db';

export async function getDbConnection() {
  return await SQLite.openDatabaseAsync(DB_NAME);
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDbConnection();
  
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      frequency_kind TEXT NOT NULL, -- 'daily' or 'weekly'
      reminder_hour INTEGER NOT NULL,
      reminder_minute INTEGER NOT NULL,
      streak INTEGER DEFAULT 0,
      last_completed_date TEXT
    );

    CREATE TABLE IF NOT EXISTS habit_weekdays (
      habit_id TEXT NOT NULL,
      weekday INTEGER NOT NULL,
      PRIMARY KEY (habit_id, weekday),
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS habit_notifications (
      notification_id TEXT PRIMARY KEY NOT NULL,
      habit_id TEXT NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
    );
  `);
}