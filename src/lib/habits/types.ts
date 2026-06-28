export type DailyFrequency = {
  kind: 'daily';
  hour: number;
  minute: number;
};

export type WeeklyFrequency = {
  kind: 'weekly';
  weekdays: number[];
  hour: number;
  minute: number;
};

export type Frequency = DailyFrequency | WeeklyFrequency;

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  frequency: Frequency;
  notificationIds: string[];
  streak: number;
  lastCompletedISO: string | null;
  createdAt: string;
};

export type NotificationData = {
  screen: '/habit';
  habitId: string;
};

export type ThemeMode = 'light' | 'dark' | 'system';
