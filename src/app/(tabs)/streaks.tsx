import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../context/ThemeContext";
import { useHabits } from "../../hooks/use-habits";
import { Habit } from "../../lib/habits/types";

// Configuration for the 15x7 grid (105 days)
const GRID_COLS = 15;
const GRID_ROWS = 7;
const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

// 1. THE ARCHITECTURE FIX: Pre-generate dates ONCE.
// Stop creating thousands of Date objects on every render cycle.
const DATE_MAP = () => {
  const dates = [];
  const today = new Date();
  for (let i = TOTAL_CELLS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
};

// Compute this exactly once when the module loads
const PRECOMPUTED_DATES = DATE_MAP();

function formatFreq(h: Habit) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(h.frequency.hour)}:${pad(h.frequency.minute)}`;
  if (h.frequency.kind === "daily") return `Daily · ${time}`;
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return `${h.frequency.weekdays.map((i) => labels[i]).join(", ")} · ${time}`;
}

// 2. MEMOIZATION: This component now only redraws if the specific habit's completion state changes.
const Heatmap = memo(({ habit, colors }: { habit: Habit; colors: any }) => {
  const s = styles(colors);

  const grid = useMemo(() => {
    return PRECOMPUTED_DATES.map((dateStr) => ({
      date: dateStr,
      isDone: habit.lastCompletedISO === dateStr, 
    }));
  }, [habit.lastCompletedISO]);

  return (
    <View style={s.heatmapContainer}>
      <View style={s.grid}>
        {grid.map((cell, i) => (
          <View
            key={i}
            style={[
              s.cell,
              { backgroundColor: cell.isDone ? colors.text : colors.bg3 },
            ]}
          />
        ))}
      </View>
      <View style={s.legend}>
        <Text style={s.legendLabel}>Last 105 days</Text>
      </View>
    </View>
  );
}, (prev, next) => prev.habit.lastCompletedISO === next.habit.lastCompletedISO);

const StreakCard = ({ habit }: { habit: Habit }) => {
  const { colors } = useTheme();
  const s = styles(colors);

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.titleRow}>
          <Text style={s.emoji}>{habit.emoji}</Text>
          <View style={s.titleGroup}>
            <Text style={s.title}>{habit.name}</Text>
            <Text style={s.freq}>{formatFreq(habit)}</Text>
          </View>
        </View>
        <View style={s.streakBadge}>
          <Ionicons name="flame" size={16} color={colors.danger} />
          <Text style={s.streakNum}>{habit.streak}</Text>
        </View>
      </View>
      <Heatmap habit={habit} colors={colors} />
    </View>
  );
};

export default function StreaksScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { habits, loading, refresh } = useHabits();
  const s = styles(colors);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.eyebrow}>History</Text>
        <Text style={s.headerTitle}>Streaks</Text>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.text} /></View>
      ) : habits.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>📊</Text>
          <Text style={s.emptyTitle}>No habits tracked</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
          {habits.map((h) => (
            <StreakCard key={h.id} habit={h} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1, color: c.text3, textTransform: "uppercase" },
  headerTitle: { fontSize: 32, fontWeight: "800", color: c.text, letterSpacing: -1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingBottom: 100 },
  
  card: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, backgroundColor: c.bg2, padding: 16, borderWidth: 1, borderColor: c.border2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  emoji: { fontSize: 32, marginRight: 12 },
  titleGroup: { flex: 1 },
  title: { fontSize: 18, fontWeight: "700", color: c.text },
  freq: { fontSize: 12, fontWeight: "500", color: c.text3, marginTop: 2 },
  
  streakBadge: { flexDirection: "row", alignItems: "center", backgroundColor: c.bg3, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  streakNum: { fontSize: 16, fontWeight: "800", color: c.text },
  
  heatmapContainer: { marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  cell: { width: 14, height: 14, borderRadius: 3 },
  legend: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  legendLabel: { fontSize: 10, fontWeight: "600", color: c.text3 },
  
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: c.text },
});