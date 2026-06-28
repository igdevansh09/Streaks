import * as SQLite from 'expo-sqlite';
import { Habit, Frequency } from './types';

const db = SQLite.openDatabaseSync('habitflow.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    frequency TEXT NOT NULL,
    notificationIds TEXT NOT NULL,
    streak INTEGER NOT NULL,
    lastCompletedISO TEXT,
    createdAt TEXT NOT NULL
  );
`);

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function rowToHabit(row: any): Habit {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    frequency: JSON.parse(row.frequency),
    notificationIds: JSON.parse(row.notificationIds),
    streak: row.streak,
    lastCompletedISO: row.lastCompletedISO,
    createdAt: row.createdAt,
  };
}

export async function loadHabits(): Promise<Habit[]> {
  try {
    const rows = await db.getAllAsync('SELECT * FROM habits');
    return rows.map(rowToHabit);
  } catch {
    return [];
  }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM habits');
      for (const habit of habits) {
        await db.runAsync(
          `INSERT INTO habits (id, name, emoji, frequency, notificationIds, streak, lastCompletedISO, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            habit.id,
            habit.name,
            habit.emoji,
            JSON.stringify(habit.frequency),
            JSON.stringify(habit.notificationIds),
            habit.streak,
            habit.lastCompletedISO,
            habit.createdAt
          ]
        );
      }
    });
  } catch (e) {
    console.warn('[storage] saveHabits failed:', e);
  }
}

export async function createHabit(
  name: string,
  emoji: string,
  frequency: Frequency,
  notificationIds: string[] = [],
): Promise<Habit> {
  const habit: Habit = {
    id: generateId(),
    name,
    emoji,
    frequency,
    notificationIds,
    streak: 0,
    lastCompletedISO: null,
    createdAt: new Date().toISOString(),
  };

  await db.runAsync(
    `INSERT INTO habits (id, name, emoji, frequency, notificationIds, streak, lastCompletedISO, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      habit.id,
      habit.name,
      habit.emoji,
      JSON.stringify(habit.frequency),
      JSON.stringify(habit.notificationIds),
      habit.streak,
      habit.lastCompletedISO,
      habit.createdAt
    ]
  );

  return habit;
}

export async function updateHabit(updated: Habit): Promise<void> {
  await db.runAsync(
    `UPDATE habits SET 
     name = ?, emoji = ?, frequency = ?, notificationIds = ?, streak = ?, lastCompletedISO = ?, createdAt = ?
     WHERE id = ?`,
    [
      updated.name,
      updated.emoji,
      JSON.stringify(updated.frequency),
      JSON.stringify(updated.notificationIds),
      updated.streak,
      updated.lastCompletedISO,
      updated.createdAt,
      updated.id
    ]
  );
}

export async function deleteHabit(id: string): Promise<void> {
  await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
}

export async function getHabit(id: string): Promise<Habit | null> {
  const row = await db.getFirstAsync('SELECT * FROM habits WHERE id = ?', [id]);
  return row ? rowToHabit(row) : null;
}

export async function markHabitDone(id: string): Promise<Habit | null> {
  const habit = await getHabit(id);
  if (!habit) return null;

  const today = todayISO();
  if (habit.lastCompletedISO === today) return habit; 

  const yesterday = yesterdayISO();
  if (habit.lastCompletedISO === yesterday) {
    habit.streak += 1;
  } else {
    habit.streak = 1;
  }
  habit.lastCompletedISO = today;

  await updateHabit(habit);
  return habit;
}

export async function unmarkHabitDone(id: string): Promise<Habit | null> {
  const habit = await getHabit(id);
  if (!habit) return null;

  const today = todayISO();
  if (habit.lastCompletedISO !== today) return habit;

  habit.lastCompletedISO = null;
  if (habit.streak > 0) habit.streak -= 1;

  await updateHabit(habit);
  return habit;
}

export function isScheduledToday(habit: Habit): boolean {
  if (habit.frequency.kind === 'daily') return true;
  const jsDay = new Date().getDay(); 
  const mappedDay = jsDay === 0 ? 6 : jsDay - 1; 
  return habit.frequency.weekdays.includes(mappedDay);
}

export function todayComplete(habit: Habit): boolean {
  return habit.lastCompletedISO === todayISO();
}