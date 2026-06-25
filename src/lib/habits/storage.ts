import { getDbConnection } from '../db/sqlite';
import { Habit, Weekday, DateString } from './types';
import { scheduleHabitReminders, cancelSpecificNotifications } from '../notifications/schedule';

export async function getAllHabitsFromDB(): Promise<Habit[]> {
  const db = await getDbConnection();
  const habitsRows: any[] = await db.getAllAsync('SELECT * FROM habits');
  const habits: Habit[] = [];

  for (const row of habitsRows) {
    const weekdaysRows: any[] = await db.getAllAsync('SELECT weekday FROM habit_weekdays WHERE habit_id = ?', [row.id]);
    const notificationsRows: any[] = await db.getAllAsync('SELECT notification_id FROM habit_notifications WHERE habit_id = ?', [row.id]);

    habits.push({
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      streak: row.streak,
      lastCompletedDate: row.last_completed_date,
      notificationIds: notificationsRows.map((r) => r.notification_id),
      frequency: row.frequency_kind === 'daily' 
        ? { kind: 'daily', hour: row.reminder_hour, minute: row.reminder_minute }
        : { kind: 'weekly', weekdays: weekdaysRows.map((r) => r.weekday as Weekday), hour: row.reminder_hour, minute: row.reminder_minute }
    });
  }
  return habits; 
}

export async function saveNewHabitToDB(habit: Omit<Habit, 'notificationIds'>): Promise<Habit> {
  const db = await getDbConnection();
  const generatedIds = await scheduleHabitReminders(habit.name, habit.emoji, habit.frequency);

  await db.runAsync(
    `INSERT INTO habits (id, name, emoji, frequency_kind, reminder_hour, reminder_minute, streak, last_completed_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [habit.id, habit.name, habit.emoji, habit.frequency.kind, habit.frequency.hour, habit.frequency.minute, habit.streak, habit.lastCompletedDate]
  );

  if (habit.frequency.kind === 'weekly') {
    for (const day of habit.frequency.weekdays) {
      await db.runAsync('INSERT INTO habit_weekdays (habit_id, weekday) VALUES (?, ?)', [habit.id, day]);
    }
  }

  for (const notifId of generatedIds) {
    await db.runAsync('INSERT INTO habit_notifications (notification_id, habit_id) VALUES (?, ?)', [notifId, habit.id]);
  }

  return { ...habit, notificationIds: generatedIds }; 
}

export async function updateHabitRemindersInDB(habitId: string, updatedHabit: Omit<Habit, 'id' | 'notificationIds' | 'streak' | 'lastCompletedDate'>): Promise<string[]> {  const db = await getDbConnection();
  const oldNotifs: any[] = await db.getAllAsync('SELECT notification_id FROM habit_notifications WHERE habit_id = ?', [habitId]);
  
  await cancelSpecificNotifications(oldNotifs.map(r => r.notification_id));
  const newIds = await scheduleHabitReminders(updatedHabit.name, updatedHabit.emoji, updatedHabit.frequency);

  await db.runAsync(
    `UPDATE habits SET name = ?, emoji = ?, frequency_kind = ?, reminder_hour = ?, reminder_minute = ? WHERE id = ?`,
    [updatedHabit.name, updatedHabit.emoji, updatedHabit.frequency.kind, updatedHabit.frequency.hour, updatedHabit.frequency.minute, habitId]
  );

  await db.runAsync('DELETE FROM habit_weekdays WHERE habit_id = ?', [habitId]);
  if (updatedHabit.frequency.kind === 'weekly') {
    for (const day of updatedHabit.frequency.weekdays) {
      await db.runAsync('INSERT INTO habit_weekdays (habit_id, weekday) VALUES (?, ?)', [habitId, day]);
    }
  }

  await db.runAsync('DELETE FROM habit_notifications WHERE habit_id = ?', [habitId]);
  for (const notifId of newIds) {
    await db.runAsync('INSERT INTO habit_notifications (notification_id, habit_id) VALUES (?, ?)', [notifId, habitId]);
  }
  return newIds; 
}

export async function deleteHabitFromDB(habitId: string): Promise<void> {
  const db = await getDbConnection();
  const oldNotifs: any[] = await db.getAllAsync('SELECT notification_id FROM habit_notifications WHERE habit_id = ?', [habitId]);
  await cancelSpecificNotifications(oldNotifs.map(r => r.notification_id));
  await db.runAsync('DELETE FROM habits WHERE id = ?', [habitId]);
  return; 
}

export async function updateStreakInDB(habitId: string, streak: number, lastCompletedDate: DateString | null): Promise<void> {
  const db = await getDbConnection();
  await db.runAsync('UPDATE habits SET streak = ?, last_completed_date = ? WHERE id = ?', [streak, lastCompletedDate, habitId]);
  return; 
}