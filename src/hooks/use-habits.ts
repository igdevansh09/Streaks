import { useState, useEffect, useCallback } from 'react';
import { parse, format, differenceInCalendarDays } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Habit, DateString } from '../lib/habits/types';
import { getAllHabitsFromDB, saveNewHabitToDB, updateHabitRemindersInDB, deleteHabitFromDB, updateStreakInDB } from '../lib/habits/storage';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHabits = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await getAllHabitsFromDB();
      setHabits(data);
    } catch (e) {
      console.error('Failed fetching data from database store:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const addHabit = async (name: string, emoji: string, frequency: Habit['frequency']): Promise<void> => {
    const freshHabit: Omit<Habit, 'notificationIds'> = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      emoji,
      frequency,
      streak: 0,
      lastCompletedDate: null,
    };
    const fullyFormed = await saveNewHabitToDB(freshHabit);
    setHabits((prev) => [...prev, fullyFormed]);
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const editHabit = async (id: string, name: string, emoji: string, frequency: Habit['frequency']): Promise<void> => {
    const updatedDetails = { name, emoji, frequency };
    const replacementIds = await updateHabitRemindersInDB(id, updatedDetails);
    
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updatedDetails, id, notificationIds: replacementIds } : h))
    );
  };

  const removeHabit = async (id: string): Promise<void> => {
    await deleteHabitFromDB(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleHabitCompletion = async (id: string): Promise<void> => {
    const target = habits.find((h) => h.id === id);
    if (!target) return;

    const todayStr = format(new Date(), 'dd-MM-yyyy');
    let finalStreak = target.streak;
    let finalDate: DateString | null = todayStr;

    if (target.lastCompletedDate === todayStr) {
      finalStreak = Math.max(0, finalStreak - 1);
      finalDate = null; 
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      if (target.lastCompletedDate) {
        const lastDateObj = parse(target.lastCompletedDate, 'dd-MM-yyyy', new Date());
        const delta = differenceInCalendarDays(new Date(), lastDateObj);
        
        if (delta === 1) {
          finalStreak += 1;
        } else if (delta > 1) {
          finalStreak = 1; 
        }
      } else {
        finalStreak = 1;
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await updateStreakInDB(id, finalStreak, finalDate);
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, streak: finalStreak, lastCompletedDate: finalDate } : h))
    );
  };

  return { habits, isLoading, addHabit, editHabit, removeHabit, toggleHabitCompletion, refresh: fetchHabits };
}