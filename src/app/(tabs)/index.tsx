import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../components/ThemeContext";
import { useHabits } from "../../hooks/use-habits";
import { usePushNotifications } from "../../hooks/use-push-notifications";
import { todayComplete } from "../../lib/habits/storage";
import { Habit } from "../../lib/habits/types";

const DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

function getTodayLabel() {
  const d = new Date();
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatFreq(h: Habit) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(h.frequency.hour)}:${pad(h.frequency.minute)}`;
  if (h.frequency.kind === "daily") return `Daily · ${time}`;
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return `${h.frequency.weekdays.map((i) => labels[i]).join(", ")} · ${time}`;
}

function HabitRow({
  habit,
  onToggle,
  onPress,
}: {
  habit: Habit;
  onToggle: () => void;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const done = todayComplete(habit);
  const s = styles(colors);

  return (
    <Pressable
      style={s.row}
      onPress={onPress}
      android_ripple={{ color: colors.bg2 }}
    >
      <TouchableOpacity
        style={[
          s.checkbox,
          done && { backgroundColor: colors.text, borderColor: colors.text },
        ]}
        onPress={onToggle}
        hitSlop={8}
      >
        {done && <Ionicons name="checkmark" size={20} color={colors.bg} />}
      </TouchableOpacity>

      <View style={s.info}>
        <Text style={[s.name, done && s.nameStrike]}>
          {habit.emoji} {habit.name}
        </Text>
        <Text style={s.meta}>{formatFreq(habit)}</Text>
      </View>

      <View style={s.streakBox}>
        <Text style={s.streakNum}>{habit.streak}</Text>
        <Text style={s.streakLabel}>DAYS</Text>
      </View>
    </Pressable>
  );
}

export default function TodayScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = styles(colors);
  const { todayHabits, loading, doneCount, pendingCount, toggleDone, refresh } =
    useHabits();
  usePushNotifications();
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (loading) {
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.eyebrow}>{getTodayLabel()}</Text>
        <Text style={s.title}>Today</Text>
        <Text style={s.subtitle}>
          {pendingCount} PENDING · {doneCount} DONE
        </Text>
      </View>

      <View style={s.divider} />

      {todayHabits.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>✨</Text>
          <Text style={s.emptyTitle}>No habits yet</Text>
          <Text style={s.emptyBody}>
            Tap the + button below to create your first habit.
          </Text>
        </View>
      ) : (
        <FlatList
          data={todayHabits}
          keyExtractor={(h) => h.id}
          renderItem={({ item }) => (
            <HabitRow
              habit={item}
              onToggle={() => toggleDone(item.id)}
              onPress={() => router.push(`/habit/${item.id}`)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity
        style={[s.fab, { bottom: insets.bottom + 80 }]}
        onPress={() => router.push("/new")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.bg} />
      </TouchableOpacity>
    </View>
  );
}

const styles = (c: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    eyebrow: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 1,
      color: c.text3,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    title: { fontSize: 32, fontWeight: "700", color: c.text, lineHeight: 36 },
    subtitle: {
      fontSize: 12,
      fontWeight: "500",
      color: c.text3,
      marginTop: 6,
      letterSpacing: 0.3,
    },
    divider: { height: 0.5, backgroundColor: c.border, marginHorizontal: 0 },

    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border,
      backgroundColor: c.bg,
    },
    checkbox: {
      width: 36,
      height: 36,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: c.border2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.bg,
    },
    info: { flex: 1, marginLeft: 14 },
    name: { fontSize: 15, fontWeight: "600", color: c.text },
    nameStrike: { textDecorationLine: "line-through", color: c.text3 },
    meta: { fontSize: 12, color: c.text3, marginTop: 2 },
    streakBox: { alignItems: "flex-end" },
    streakNum: {
      fontSize: 22,
      fontWeight: "700",
      color: c.text,
      lineHeight: 24,
    },
    streakLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: c.text3,
      letterSpacing: 0.5,
    },

    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: c.text,
      marginBottom: 6,
    },
    emptyBody: {
      fontSize: 13,
      color: c.text3,
      textAlign: "center",
      lineHeight: 20,
    },

    fab: {
      position: "absolute",
      right: 16,
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: c.text,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
      }),
    },
  });
