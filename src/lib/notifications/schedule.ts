import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit, NotificationData } from '../habits/types';
import { CHANNEL_ID } from './setup';

export async function scheduleHabitReminders(
  habit: Pick<Habit, 'id' | 'name' | 'emoji' | 'frequency'>,
): Promise<string[]> {
  try {
    const { frequency } = habit;
    const ids: string[] = [];

    const content: Notifications.NotificationContentInput = {
      title: `Time for ${habit.emoji} ${habit.name}`,
      body: 'Tap to log it.',
      sound: 'default',
      data: {
        screen: '/habit',
        habitId: habit.id,
      } satisfies NotificationData,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    };

    if (frequency.kind === 'daily') {
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: frequency.hour,
          minute: frequency.minute,
        },
      });
      ids.push(id);
    } else {
      for (const weekday of frequency.weekdays) {
        const expoWeekday = weekday + 1;
        const id = await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: expoWeekday,
            hour: frequency.hour,
            minute: frequency.minute,
          },
        });
        ids.push(id);
      }
    }

    return ids;
  } catch (e) {
    console.warn('[schedule] scheduleHabitReminders failed:', e);
    return [];
  }
}

export async function cancelHabitReminders(notificationIds: string[]): Promise<void> {
  await Promise.allSettled(
    notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}

export async function rescheduleHabitReminders(
  oldNotificationIds: string[],
  habit: Pick<Habit, 'id' | 'name' | 'emoji' | 'frequency'>,
): Promise<string[]> {
  await cancelHabitReminders(oldNotificationIds);
  return scheduleHabitReminders(habit);
}


export async function getAllScheduledCount(): Promise<number> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.length;
}

export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
