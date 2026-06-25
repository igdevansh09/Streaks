import * as Notifications from 'expo-notifications';
import { Habit } from '../habits/types';

export async function scheduleHabitReminders(
  name: string,
  emoji: string,
  frequency: Habit['frequency']
): Promise<string[]> {
  const title = `${emoji} Time for your habit!`;
  const body = `Don't break the chain! Remember to complete: ${name}`;
  const notificationIds: string[] = [];

  if (frequency.kind === 'daily') {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { screen: '/habit', habitName: name },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: frequency.hour,
        minute: frequency.minute,
      },
    });
    notificationIds.push(id);
  } else if (frequency.kind === 'weekly') {
    for (const day of frequency.weekdays) {
      const expoWeekday = day === 0 ? 1 : day + 1; 
      
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data: { screen: '/habit', habitName: name },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: expoWeekday,
          hour: frequency.hour,
          minute: frequency.minute,
        },
      });
      notificationIds.push(id);
    }
  }

  return notificationIds;
}

export async function cancelSpecificNotifications(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map(async (id) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (error) {
        console.warn(`Failed to cancel notification ${id}:`, error);
      }
    })
  );
}