import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

  const habitsRef = useRef<Habit[]>([]);
  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

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

  const { todayHabits, doneCount, pendingCount } = useMemo(() => {
    const today = habits.filter(isScheduledToday);
    const done = today.filter(todayComplete).length;
    return {
      todayHabits: today,
      doneCount: done,
      pendingCount: today.length - done,
    };
  }, [habits]);

  const createHabit = useCallback(async (input: CreateHabitInput): Promise<Habit> => {
    const habit = await storageCreate(input.name, input.emoji, input.frequency, []);
    const notificationIds = await scheduleHabitReminders(habit);
    const finalHabit: Habit = { ...habit, notificationIds };
    await storageUpdate(finalHabit);
    setHabits((prev) => [...prev, finalHabit]);
    return finalHabit;
  }, []); 

  const editHabit = useCallback(async (input: EditHabitInput): Promise<void> => {
    const existing = habitsRef.current.find((h) => h.id === input.id);
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
  }, []); 

  const deleteHabit = useCallback(async (id: string): Promise<void> => {
    const habit = habitsRef.current.find((h) => h.id === id);
    if (habit) {
      await cancelHabitReminders(habit.notificationIds);
    }
    await storageDelete(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []); 

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

  const toggleDone = useCallback(async (id: string): Promise<void> => {
    const habit = habitsRef.current.find((h) => h.id === id);
    if (!habit) return;
    
    if (todayComplete(habit)) {
      const updated = await storageUnmarkDone(id);
      if (updated) setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
    } else {
      const updated = await storageMarkDone(id);
      if (updated) setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
    }
  }, []);

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