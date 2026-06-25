import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { Habit } from '../lib/habits/types';
import StreakBadge from './StreakBadge';

interface HabitCardProps {
  habit: Habit;
  onToggleCompletion: (id: string) => void;
  onPress: (id: string) => void;
}

export default function HabitCard({ habit, onToggleCompletion, onPress }: HabitCardProps) {
  const todayStr = format(new Date(), 'dd-MM-yyyy');
  const isCompletedToday = habit.lastCompletedDate === todayStr;

  const timeString = `${habit.frequency.hour}:${habit.frequency.minute.toString().padStart(2, '0')}`;
  const frequencyText = habit.frequency.kind === 'daily' 
    ? `Daily at ${timeString}` 
    : `Weekly (${habit.frequency.weekdays.length}x) at ${timeString}`;

  return (
    <Pressable 
      onPress={() => onPress(habit.id)} 
      style={({ pressed }) => [
        styles.touchableWrapper,
        pressed && styles.touchablePressed
      ]}
    >
      <LinearGradient
        colors={isCompletedToday ? ['#1A1C1E', '#121314'] : ['#2C2F33', '#232528']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, isCompletedToday && styles.cardCompleted]}
      >
        <View style={styles.leftColumn}>
          <Text style={styles.emoji}>{habit.emoji}</Text>
          <View style={styles.info}>
            <Text style={[styles.name, isCompletedToday && styles.nameCompleted]}>
              {habit.name}
            </Text>
            <Text style={styles.frequency}>{frequencyText}</Text>
          </View>
        </View>

        <View style={styles.rightColumn}>
          <StreakBadge streak={habit.streak} />
          
          <Pressable
            hitSlop={12}
            style={[styles.actionButton, isCompletedToday && styles.actionButtonActive]}
            onPress={() => onToggleCompletion(habit.id)}
          >
            <Ionicons
              name={isCompletedToday ? 'checkmark' : 'add'}
              size={24}
              color={isCompletedToday ? '#000000' : '#FFFFFF'}
            />
          </Pressable>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchableWrapper: {
    marginBottom: 12,
    borderRadius: 16,
  },
  touchablePressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardCompleted: {
    borderColor: 'rgba(255,255,255,0.02)',
  },
  leftColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightColumn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  nameCompleted: {
    color: '#888888',
    textDecorationLine: 'line-through',
  },
  frequency: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#32D74B',
  },
});