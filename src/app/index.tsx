import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useHabits } from '../hooks/use-habits';
import HabitCard from '../components/HabitCard';

export default function MainScreen() {
  const { habits, isLoading, toggleHabitCompletion } = useHabits();
  const router = useRouter();

  const todayFormatted = format(new Date(), 'EEEE, MMMM do');

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#32D74B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{todayFormatted}</Text>
          <Text style={styles.greetingText}>Your Habits</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable 
            hitSlop={12} 
            onPress={() => router.push('/settings')} 
            style={styles.iconButton}
          >
            <Ionicons name="settings-outline" size={24} color="#888888" />
          </Pressable>
          <Pressable 
            hitSlop={12} 
            onPress={() => router.push('/new')} 
            style={styles.iconButton}
          >
            <Ionicons name="add-circle" size={32} color="#32D74B" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            onToggleCompletion={toggleHabitCompletion}
            onPress={(id) => router.push(`/habit/${id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={64} color="#333333" />
            <Text style={styles.emptyStateTitle}>System Empty</Text>
            <Text style={styles.emptyStateSub}>
              Tap the + icon to schedule your first habit and initialize the notification engine.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dateText: {
    fontSize: 14,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 14,
    color: '#444444',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});