import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../components/ThemeContext';
import { useHabits } from '../../hooks/use-habits';
import { Habit } from '../../lib/habits/types';


const GRID_COLS = 15;
const GRID_ROWS = 7;
const TOTAL_CELLS = GRID_COLS * GRID_ROWS; 

function getISODate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function getCellLevel(habit: Habit, daysAgo: number): 0 | 1 | 2 | 3 {
  const iso = getISODate(daysAgo);
  if (habit.lastCompletedISO === iso) return 3;
  return 0;
}


function Heatmap({ habit, colors }: { habit: Habit; colors: ReturnType<typeof useTheme>['colors'] }) {
  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => {
    const daysAgo = TOTAL_CELLS - 1 - i;
    const level = getCellLevel(habit, daysAgo);
    return { key: i, level };
  });

  const cellBg = (level: 0 | 1 | 2 | 3) => {
    if (level === 0) return colors.bg3;
    if (level === 1) return colors.border2;
    if (level === 2) return colors.text3;
    return colors.text;
  };

  return (
    <View>
      <View style={heatStyles.grid}>
        {cells.map((c) => (
          <View
            key={c.key}
            style={[heatStyles.cell, { backgroundColor: cellBg(c.level) }]}
          />
        ))}
      </View>
      <View style={heatStyles.legend}>
        <Text style={[heatStyles.legendLabel, { color: colors.text3 }]}>LESS</Text>
        <View style={heatStyles.legendCells}>
          {([0, 1, 2, 3] as const).map((l) => (
            <View
              key={l}
              style={[heatStyles.legendCell, { backgroundColor: cellBg(l) }]}
            />
          ))}
        </View>
        <Text style={[heatStyles.legendLabel, { color: colors.text3 }]}>MORE</Text>
        <Text style={[heatStyles.legendLabel, { color: colors.text3, marginLeft: 'auto' }]}>
          LONGEST {habit.streak}
        </Text>
      </View>
    </View>
  );
}

const heatStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginBottom: 8,
  },
  cell: { width: 16, height: 16, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendLabel: { fontSize: 10, fontWeight: '600' },
  legendCells: { flexDirection: 'row', gap: 3 },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
});


function StreakCard({ habit }: { habit: Habit }) {
  const { colors } = useTheme();
  const s = cardStyles(colors);

  return (
    <View style={s.card}>
      <View style={s.header}>
        <Text style={s.title}>
          {habit.emoji} {habit.name}
        </Text>
        <View style={s.streakBox}>
          <Text style={s.streakNum}>{habit.streak}</Text>
          <Text style={s.streakLabel}>CURRENT</Text>
        </View>
      </View>
      <Heatmap habit={habit} colors={colors} />
    </View>
  );
}

const cardStyles = (c: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 12,
      backgroundColor: c.bg2,
      borderWidth: 0.5,
      borderColor: c.border,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: { fontSize: 16, fontWeight: '700', color: c.text, flex: 1 },
    streakBox: { alignItems: 'flex-end' },
    streakNum: { fontSize: 28, fontWeight: '700', color: c.text, lineHeight: 30 },
    streakLabel: {
      fontSize: 10, fontWeight: '600', color: c.text3,
      letterSpacing: 0.5, textTransform: 'uppercase',
    },
  });


export default function StreaksScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { habits, loading, refresh } = useHabits();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, color: colors.text3, textTransform: 'uppercase', marginBottom: 4 }}>
          HISTORY
        </Text>
        <Text style={{ fontSize: 32, fontWeight: '700', color: colors.text }}>Streaks</Text>
      </View>

      <View style={{ height: 0.5, backgroundColor: colors.border, marginBottom: 16 }} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : habits.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 6 }}>
            No habits tracked
          </Text>
          <Text style={{ fontSize: 13, color: colors.text3, textAlign: 'center', lineHeight: 20 }}>
            Create habits and mark them done to see your streak history here.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {habits.map((h) => (
            <StreakCard key={h.id} habit={h} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
