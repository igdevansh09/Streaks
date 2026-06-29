import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { memo, useCallback } from "react";
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
import { useTheme } from "../../context/ThemeContext";
import { useHabits } from "../../hooks/use-habits";
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

function getTodayLabel() {
  const d = new Date();
  const dayName = DAYS[d.getDay()];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dayName} · ${dd}-${mm}-${yyyy}`;
}

function formatFreq(h: Habit) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(h.frequency.hour)}:${pad(h.frequency.minute)}`;
  if (h.frequency.kind === "daily") return `Daily · ${time}`;
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return `${h.frequency.weekdays.map((i) => labels[i]).join(", ")} · ${time}`;
}

const HabitRow = memo(
  ({
    habit,
    onToggle,
    onPress,
  }: {
    habit: Habit;
    onToggle: (id: string) => void;
    onPress: (id: string) => void;
  }) => {
    const { colors } = useTheme();
    const done = todayComplete(habit);
    const s = styles(colors);

    const handleToggle = () => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(
          done
            ? Haptics.ImpactFeedbackStyle.Light
            : Haptics.ImpactFeedbackStyle.Medium,
        );
      }
      onToggle(habit.id);
    };

    return (
      <Pressable
        style={[s.row, done && { opacity: 0.75 }]}
        onPress={() => onPress(habit.id)}
        android_ripple={{ color: colors.bg2 }}
      >
        <TouchableOpacity
          style={[
            s.checkbox,
            done && { backgroundColor: colors.text, borderColor: colors.text },
          ]}
          onPress={handleToggle}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
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
          <Text style={[s.streakNum, done && { color: colors.text3 }]}>
            {habit.streak}
          </Text>
          <Text style={[s.streakLabel, done && { color: colors.border2 }]}>
            DAYS
          </Text>
        </View>
      </Pressable>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to ensure rows only re-render if their specific data changes
    return (
      prevProps.habit.id === nextProps.habit.id &&
      todayComplete(prevProps.habit) === todayComplete(nextProps.habit) &&
      prevProps.habit.streak === nextProps.habit.streak &&
      prevProps.habit.name === nextProps.habit.name
    );
  },
);

export default function TodayScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = styles(colors);

  const { todayHabits, loading, doneCount, pendingCount, toggleDone, refresh } =
    useHabits();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleRowPress = useCallback(
    (id: string) => {
      if (Platform.OS !== "web")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/habit/${id}`);
    },
    [router],
  );

  if (loading) {
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator color={colors.text} size="large" />
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
              onToggle={toggleDone}
              onPress={handleRowPress}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity
        style={[s.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => {
          if (Platform.OS !== "web")
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/new");
        }}
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
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
    eyebrow: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.2,
      color: c.text3,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    title: {
      fontSize: 36,
      fontWeight: "800",
      color: c.text,
      letterSpacing: -1,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: "600",
      color: c.text3,
      marginTop: 8,
      letterSpacing: 0.5,
    },
    divider: {
      height: 1,
      backgroundColor: c.border2,
      marginHorizontal: 20,
      marginBottom: 8,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: c.bg,
    },
    checkbox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.border2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.bg,
    },
    info: { flex: 1, marginLeft: 16 },
    name: {
      fontSize: 16,
      fontWeight: "700",
      color: c.text,
      letterSpacing: -0.2,
    },
    nameStrike: { textDecorationLine: "line-through", color: c.text3 },
    meta: { fontSize: 12, fontWeight: "500", color: c.text3, marginTop: 4 },
    streakBox: { alignItems: "flex-end", paddingLeft: 12 },
    streakNum: {
      fontSize: 24,
      fontWeight: "800",
      color: c.text,
      fontVariant: ["tabular-nums"],
      letterSpacing: -0.5,
    },
    streakLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: c.text3,
      letterSpacing: 0.8,
    },

    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: c.text,
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    emptyBody: {
      fontSize: 15,
      color: c.text3,
      textAlign: "center",
      lineHeight: 22,
    },

    fab: {
      position: "absolute",
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: c.text,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: { elevation: 6 },
      }),
    },
  });
