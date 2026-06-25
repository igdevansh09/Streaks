import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useHabits } from '../../hooks/use-habits';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { habits, removeHabit, toggleHabitCompletion } = useHabits();

  const habit = habits.find((h) => h.id === id);

  if (!habit) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={48} color="#FF453A" />
        <Text style={styles.errorText}>Habit not found or deleted.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>Return Home</Text>
        </Pressable>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      'This will permanently delete your streak and cancel all scheduled OS reminders. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Destroy', 
          style: 'destructive',
          onPress: async () => {
            await removeHabit(habit.id);
            router.replace('/');
          }
        }
      ]
    );
  };

  const todayStr = format(new Date(), 'dd-MM-yyyy');
  const isCompletedToday = habit.lastCompletedDate === todayStr;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={handleDelete} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={24} color="#FF453A" />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.emoji}>{habit.emoji}</Text>
        <Text style={styles.title}>{habit.name}</Text>
        
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={20} color="#FF9F0A" />
          <Text style={styles.streakText}>{habit.streak} Day Streak</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Frequency</Text>
          <Text style={styles.statValue}>
            {habit.frequency.kind === 'daily' ? 'Daily' : 'Weekly'}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Target Time</Text>
          <Text style={styles.statValue}>
            {habit.frequency.hour}:{habit.frequency.minute.toString().padStart(2, '0')}
          </Text>
        </View>
      </View>

      <Pressable 
        style={[styles.actionBtn, isCompletedToday && styles.actionBtnDone]} 
        onPress={() => toggleHabitCompletion(habit.id)}
      >
        <Ionicons 
          name={isCompletedToday ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={isCompletedToday ? "#000000" : "#FFFFFF"} 
        />
        <Text style={[styles.actionBtnText, isCompletedToday && styles.actionBtnTextDone]}>
          {isCompletedToday ? 'Completed Today' : 'Mark as Done'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  errorText: { color: '#FFFFFF', fontSize: 18, marginTop: 16, marginBottom: 24 },
  backBtn: { backgroundColor: '#333333', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  backBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  iconBtn: { padding: 4 },
  hero: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  emoji: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakText: { color: '#FF9F0A', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 40,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1A1C1E',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statLabel: { color: '#888888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  statValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2F33',
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  actionBtnDone: { backgroundColor: '#32D74B' },
  actionBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  actionBtnTextDone: { color: '#000000' },
});