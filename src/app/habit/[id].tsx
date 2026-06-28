import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../components/ThemeContext';
import {
  getHabit,
  markHabitDone,
  unmarkHabitDone,
  todayComplete,
  isScheduledToday,
} from '../../lib/habits/storage';
import { Habit } from '../../lib/habits/types';


const pad = (n: number) => String(n).padStart(2, '0');

function formatFreq(h: Habit) {
  const time = `${pad(h.frequency.hour)}:${pad(h.frequency.minute)}`;
  if (h.frequency.kind === 'daily') return `Daily · ${time}`;
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return `${h.frequency.weekdays.map((i) => labels[i]).join(', ')} · ${time}`;
}


function StatCard({
  label,
  value,
  sub,
  colors,
}: {
  label: string;
  value: string;
  sub?: string;
  colors: any;
}) {
  return (
    <View style={{
      flex: 1, backgroundColor: colors.bg2, borderRadius: 12,
      padding: 14, borderWidth: 0.5, borderColor: colors.border,
    }}>
      <Text style={{ fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.text3, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>{value}</Text>
      {sub ? (
        <Text style={{ fontSize: 11, color: colors.text3, marginTop: 2 }}>{sub}</Text>
      ) : null}
    </View>
  );
}


export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    const h = await getHabit(id);
    if (!h) { setNotFound(true); } else { setHabit(h); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async () => {
    if (!habit) return;
    let updated: Habit | null;
    if (todayComplete(habit)) {
      updated = await unmarkHabitDone(habit.id);
    } else {
      updated = await markHabitDone(habit.id);
    }
    if (updated) setHabit(updated);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (notFound || !habit) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
          Habit not found
        </Text>
        <Text style={{ fontSize: 13, color: colors.text3, textAlign: 'center', marginBottom: 24 }}>
          The habit with ID "{id}" doesn't exist or was deleted.
        </Text>
        <TouchableOpacity
          style={{ padding: 14, borderRadius: 8, backgroundColor: colors.text }}
          onPress={() => router.replace('/(tabs)/index')}
        >
          <Text style={{ color: colors.bg, fontWeight: '700' }}>Go to Today</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const done = todayComplete(habit);
  const scheduledToday = isScheduledToday(habit);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20, alignSelf: 'flex-start' }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text2} />
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text2 }}>Back</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 48, marginBottom: 8 }}>{habit.emoji}</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>{habit.name}</Text>
          <Text style={{ fontSize: 13, color: colors.text3, marginTop: 4 }}>{formatFreq(habit)}</Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 20 }}>
          <StatCard label="Current streak" value={String(habit.streak)} sub="days" colors={colors} />
          <StatCard label="Longest streak" value={String(Math.max(habit.streak, 1))} sub="days" colors={colors} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 20 }}>
          <StatCard
            label="Frequency"
            value={habit.frequency.kind === 'daily' ? 'Daily' : 'Weekly'}
            sub={`${pad(habit.frequency.hour)}:${pad(habit.frequency.minute)}`}
            colors={colors}
          />
          <StatCard
            label="Last done"
            value={habit.lastCompletedISO ? habit.lastCompletedISO.slice(5) : 'Never'}
            sub={habit.lastCompletedISO ? 'completed' : ''}
            colors={colors}
          />
        </View>

        {/* Mark done button */}
        {scheduledToday && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                padding: 14, borderRadius: 8, alignItems: 'center',
                backgroundColor: done ? colors.bg2 : colors.text,
                borderWidth: 0.5, borderColor: done ? colors.border2 : colors.text,
              }}
              onPress={handleToggle}
              activeOpacity={0.85}
            >
              <Text style={{
                fontSize: 15, fontWeight: '700',
                color: done ? colors.text3 : colors.bg,
              }}>
                {done ? '✓ Completed today' : 'Mark as done'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notification IDs */}
        <View style={{
          marginHorizontal: 20, marginBottom: 20, backgroundColor: colors.bg2,
          borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.text3, marginBottom: 8 }}>
            Scheduled Notification IDs
          </Text>
          {habit.notificationIds.length === 0 ? (
            <Text style={{ fontSize: 12, color: colors.text3 }}>
              No IDs stored. Grant permission and save the habit to schedule reminders.
            </Text>
          ) : (
            habit.notificationIds.map((nid, i) => (
              <Text
                key={i}
                style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: colors.text2,
                  backgroundColor: colors.bg3,
                  padding: 6,
                  borderRadius: 4,
                  marginBottom: 4,
                }}
              >
                {nid}
              </Text>
            ))
          )}
        </View>

        {/* Edit button */}
        <View style={{ marginHorizontal: 20 }}>
          <TouchableOpacity
            style={{
              padding: 14, borderRadius: 8, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 8,
              borderWidth: 0.5, borderColor: colors.border2, backgroundColor: colors.bg,
            }}
            onPress={() => router.push({ pathname: '/new', params: { editId: habit.id } })}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.text} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Edit Habit
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
