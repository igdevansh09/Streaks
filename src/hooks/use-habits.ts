import { useState, useEffect, useCallback } from 'react';
import {
  loadHabits,
  createHabit as storageCreate,
  updateHabit as storageUpdate,
  deleteHabit as storageDelete,
  markHabitDone as storageMarkDone,
  unmarkHabitDone as storageUnmarkDone,
  isScheduledToday,
  todayComplete,
} from '../lib/habits/storage';
import {
  scheduleHabitReminders,
  cancelHabitReminders,
  rescheduleHabitReminders,
} from '../lib/notifications/schedule';
import { Habit, Frequency } from '../lib/habits/types';


export type CreateHabitInput = {
  name: string;
  emoji: string;
  frequency: Frequency;
};

export type EditHabitInput = CreateHabitInput & { id: string };


export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadHabits().then((data) => {
      if (!cancelled) {
        setHabits(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const todayHabits = habits.filter(isScheduledToday);
  const doneCount = todayHabits.filter(todayComplete).length;
  const pendingCount = todayHabits.length - doneCount;

  const createHabit = useCallback(async (input: CreateHabitInput): Promise<Habit> => {
    const notificationIds = await scheduleHabitReminders({
      id: '__pending__',
      ...input,
    });

    const habit = await storageCreate(input.name, input.emoji, input.frequency, notificationIds);

    if (notificationIds.length > 0) {
      await cancelHabitReminders(notificationIds);
      const realIds = await scheduleHabitReminders(habit);
      const updated: Habit = { ...habit, notificationIds: realIds };
      await storageUpdate(updated);
      setHabits((prev) => [...prev, updated]);
      return updated;
    }

    setHabits((prev) => [...prev, habit]);
    return habit;
  }, []);

  const editHabit = useCallback(
    async (input: EditHabitInput): Promise<void> => {
      const existing = habits.find((h) => h.id === input.id);
      if (!existing) return;

      const newIds = await rescheduleHabitReminders(existing.notificationIds, {
        id: existing.id,
        name: input.name,
        emoji: input.emoji,
        frequency: input.frequency,
      });

      const updated: Habit = {
        ...existing,
        name: input.name,
        emoji: input.emoji,
        frequency: input.frequency,
        notificationIds: newIds,
      };

      await storageUpdate(updated);
      setHabits((prev) => prev.map((h) => (h.id === input.id ? updated : h)));
    },
    [habits],
  );

  const deleteHabit = useCallback(
    async (id: string): Promise<void> => {
      const habit = habits.find((h) => h.id === id);
      if (habit) {
        await cancelHabitReminders(habit.notificationIds);
      }
      await storageDelete(id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
    },
    [habits],
  );

  const markDone = useCallback(async (id: string): Promise<void> => {
    const updated = await storageMarkDone(id);
    if (updated) {
      setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
    }
  }, []);

  const unmarkDone = useCallback(async (id: string): Promise<void> => {
    const updated = await storageUnmarkDone(id);
    if (updated) {
      setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
    }
  }, []);

  const toggleDone = useCallback(
    async (id: string): Promise<void> => {
      const habit = habits.find((h) => h.id === id);
      if (!habit) return;
      if (todayComplete(habit)) {
        await unmarkDone(id);
      } else {
        await markDone(id);
      }
    },
    [habits, markDone, unmarkDone],
  );

  const refresh = useCallback(async () => {
    const data = await loadHabits();
    setHabits(data);
  }, []);

  return {
    habits,
    todayHabits,
    loading,
    doneCount,
    pendingCount,
    createHabit,
    editHabit,
    deleteHabit,
    markDone,
    unmarkDone,
    toggleDone,
    refresh,
  };
}
