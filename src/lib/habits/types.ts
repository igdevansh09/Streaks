export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; 

export type Frequency =
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'weekly'; weekdays: Weekday[]; hour: number; minute: number };

export type DateString = string; 

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  frequency: Frequency;
  streak: number;
  lastCompletedDate: DateString | null; 
  notificationIds: string[];
}