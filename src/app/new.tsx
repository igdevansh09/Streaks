import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useHabits } from '../hooks/use-habits';
import { Weekday, Frequency } from '../lib/habits/types';

const DAYS_OF_WEEK = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

export default function NewHabitScreen() {
  const router = useRouter();
  const { addHabit } = useHabits();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🔥');
  const [freqKind, setFreqKind] = useState<'daily' | 'weekly'>('daily');
  const [selectedDays, setSelectedDays] = useState<Weekday[]>([]);
  const [hourStr, setHourStr] = useState('09');
  const [minuteStr, setMinuteStr] = useState('00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day as Weekday) 
        ? prev.filter(d => d !== day) 
        : [...prev, day as Weekday]
    );
  };

  const handleSave = async () => {
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (!name.trim()) return Alert.alert('Invalid Input', 'Habit name is required.');
    if (!emoji.trim()) return Alert.alert('Invalid Input', 'An emoji is required.');
    if (isNaN(hour) || hour < 0 || hour > 23) return Alert.alert('Invalid Time', 'Hour must be 0-23.');
    if (isNaN(minute) || minute < 0 || minute > 59) return Alert.alert('Invalid Time', 'Minute must be 0-59.');
    if (freqKind === 'weekly' && selectedDays.length === 0) {
      return Alert.alert('Invalid Input', 'Select at least one day for weekly habits.');
    }

    const frequency: Frequency = freqKind === 'daily'
      ? { kind: 'daily', hour, minute }
      : { kind: 'weekly', weekdays: selectedDays, hour, minute };

    try {
      setIsSubmitting(true);
      await addHabit(name.trim(), emoji.trim(), frequency);
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('System Error', 'Failed to save habit and schedule notifications.');
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#888888" />
        </Pressable>
        <Text style={styles.headerTitle}>New Habit</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Identity</Text>
          <View style={styles.identityRow}>
            <View style={styles.emojiInputContainer}>
              <TextInput
                style={styles.emojiInput}
                value={emoji}
                onChangeText={(text) => setEmoji(text.substring(0, 2))}
                maxLength={2}
                autoCorrect={false}
              />
            </View>
            <View style={styles.nameInputContainer}>
              <TextInput
                style={styles.nameInput}
                placeholder="e.g., Drink Water"
                placeholderTextColor="#555555"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Frequency</Text>
          <View style={styles.segmentedControl}>
            <Pressable 
              style={[styles.segmentBtn, freqKind === 'daily' && styles.segmentBtnActive]}
              onPress={() => setFreqKind('daily')}
            >
              <Text style={[styles.segmentText, freqKind === 'daily' && styles.segmentTextActive]}>
                Daily
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.segmentBtn, freqKind === 'weekly' && styles.segmentBtnActive]}
              onPress={() => setFreqKind('weekly')}
            >
              <Text style={[styles.segmentText, freqKind === 'weekly' && styles.segmentTextActive]}>
                Weekly
              </Text>
            </Pressable>
          </View>

          {freqKind === 'weekly' && (
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((day) => {
                const isActive = selectedDays.includes(day.value as Weekday);
                return (
                  <Pressable
                    key={day.value}
                    style={[styles.dayCircle, isActive && styles.dayCircleActive]}
                    onPress={() => toggleDay(day.value)}
                  >
                    <Text style={[styles.dayText, isActive && styles.dayTextActive]}>
                      {day.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Reminder Time (24h)</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={styles.timeInput}
              keyboardType="number-pad"
              maxLength={2}
              value={hourStr}
              onChangeText={setHourStr}
              placeholder="09"
              placeholderTextColor="#555555"
            />
            <Text style={styles.timeColon}>:</Text>
            <TextInput
              style={styles.timeInput}
              keyboardType="number-pad"
              maxLength={2}
              value={minuteStr}
              onChangeText={setMinuteStr}
              placeholder="00"
              placeholderTextColor="#555555"
            />
          </View>
        </View>

        <Pressable 
          style={({ pressed }) => [styles.submitWrapper, pressed && styles.submitPressed]} 
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={['#32D74B', '#28A73B']}
            style={styles.submitBtn}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'Initializing...' : 'Schedule Habit'}
            </Text>
          </LinearGradient>
        </Pressable>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '600',
  },
  identityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emojiInputContainer: {
    backgroundColor: '#1A1C1E',
    borderRadius: 16,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emojiInput: {
    fontSize: 32,
    textAlign: 'center',
  },
  nameInputContainer: {
    flex: 1,
    backgroundColor: '#1A1C1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  nameInput: {
    color: '#FFFFFF',
    fontSize: 18,
    height: '100%',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1A1C1E',
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#2C2F33',
  },
  segmentText: {
    color: '#888888',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dayCircleActive: {
    backgroundColor: '#32D74B',
    borderColor: '#32D74B',
  },
  dayText: {
    color: '#888888',
    fontWeight: 'bold',
  },
  dayTextActive: {
    color: '#000000',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    backgroundColor: '#1A1C1E',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 72,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timeColon: {
    color: '#888888',
    fontSize: 24,
    fontWeight: 'bold',
  },
  submitWrapper: {
    marginTop: 12,
    borderRadius: 16,
  },
  submitPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  submitBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});