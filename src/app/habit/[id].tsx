import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../context/ThemeContext";
import {
  getHabit,
  isScheduledToday,
  markHabitDone,
  todayComplete,
  unmarkHabitDone,
} from "../../lib/habits/storage";
import { Habit } from "../../lib/habits/types";

const pad = (n: number) => String(n).padStart(2, "0");

function formatFreq(h: Habit) {
  const time = `${pad(h.frequency.hour)}:${pad(h.frequency.minute)}`;
  if (h.frequency.kind === "daily") return `Daily · ${time}`;
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return `${h.frequency.weekdays.map((i) => labels[i]).join(", ")} · ${time}`;
}

function formatLastDone(isoString?: string) {
  if (!isoString) return "Never";
  try {
    const datePart = isoString.split("T")[0];
    const [year, month, day] = datePart.split("-");
    return `${day}-${month}-${year}`;
  } catch {
    return "Invalid Date";
  }
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
  const s = makeStyles(colors);
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
      {sub ? <Text style={s.statSub}>{sub}</Text> : null}
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
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const h = await getHabit(id);
    if (!h) {
      setNotFound(true);
    } else {
      setHabit(h);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const triggerHaptic = (
    style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
  ) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  };

  const handleToggle = async () => {
    if (!habit) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    let updated: Habit | null;
    if (todayComplete(habit)) {
      updated = await unmarkHabitDone(habit.id);
    } else {
      updated = await markHabitDone(habit.id);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    if (updated) setHabit(updated);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.text} size="large" />
      </View>
    );
  }

  const s = makeStyles(colors);

  if (notFound || !habit) {
    return (
      <View style={s.notFoundContainer}>
        <Text style={s.notFoundIcon}>🔍</Text>
        <Text style={s.notFoundTitle}>Habit not found</Text>
        <Text style={s.notFoundText}>
          The habit with ID "{id}" doesn't exist or was deleted.
        </Text>
        <TouchableOpacity
          style={s.btnPrimary}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.8}
        >
          <Text style={[s.btnPrimaryText, { color: colors.bg }]}>
            Go to Today
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const done = todayComplete(habit);
  const scheduledToday = isScheduledToday(habit);

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              router.back();
            }}
            style={s.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text2} />
            <Text style={s.backBtnText}>Back</Text>
          </TouchableOpacity>

          <View style={s.titleContainer}>
            <Text style={s.emojiLarge}>{habit.emoji}</Text>
            <Text style={s.titleText}>{habit.name}</Text>
            <Text style={s.subtitleText}>{formatFreq(habit)}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard
            label="Current streak"
            value={String(habit.streak)}
            sub="days"
            colors={colors}
          />
          <StatCard
            label="Longest streak"
            value={String(Math.max(habit.streak, 1))}
            sub="days"
            colors={colors}
          />
        </View>
        <View style={s.statsRow}>
          <StatCard
            label="Frequency"
            value={habit.frequency.kind === "daily" ? "Daily" : "Weekly"}
            sub={`${pad(habit.frequency.hour)}:${pad(habit.frequency.minute)}`}
            colors={colors}
          />
          <StatCard
            label="Last done"
            value={formatLastDone(habit.lastCompletedISO ?? undefined)}
            sub={habit.lastCompletedISO ? "completed" : ""}
            colors={colors}
          />
        </View>

        {/* Mark done button */}
        {scheduledToday && (
          <View style={s.actionSection}>
            <TouchableOpacity
              style={[
                s.btnToggle,
                done
                  ? { backgroundColor: colors.bg2, borderColor: colors.border2 }
                  : { backgroundColor: colors.text, borderColor: colors.text },
              ]}
              onPress={handleToggle}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  s.btnToggleText,
                  done ? { color: colors.text3 } : { color: colors.bg },
                ]}
              >
                {done ? "✓ Completed today" : "Mark as done"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Edit button */}
        <View style={s.actionSection}>
          <TouchableOpacity
            style={s.btnOutline}
            onPress={() => {
              triggerHaptic();
              router.push({ pathname: "/new", params: { editId: habit.id } });
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.text} />
            <Text style={s.btnOutlineText}>Edit Habit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: any) {
  return StyleSheet.create({
    notFoundContainer: {
      flex: 1,
      backgroundColor: c.bg,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    notFoundIcon: { fontSize: 48, marginBottom: 16 },
    notFoundTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: c.text,
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    notFoundText: {
      fontSize: 14,
      color: c.text3,
      textAlign: "center",
      marginBottom: 32,
      lineHeight: 20,
    },

    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 24,
      alignSelf: "flex-start",
      paddingVertical: 4,
      paddingRight: 12,
    },
    backBtnText: { fontSize: 15, fontWeight: "600", color: c.text2 },
    titleContainer: { alignItems: "flex-start" },
    emojiLarge: { fontSize: 56, marginBottom: 12 },
    titleText: {
      fontSize: 32,
      fontWeight: "800",
      color: c.text,
      letterSpacing: -1,
      marginBottom: 6,
    },
    subtitleText: {
      fontSize: 15,
      fontWeight: "500",
      color: c.text3,
      letterSpacing: 0.2,
    },

    statsRow: {
      flexDirection: "row",
      gap: 12,
      marginHorizontal: 20,
      marginBottom: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: c.bg2,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: c.text3,
      marginBottom: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "800",
      color: c.text,
      fontVariant: ["tabular-nums"],
      letterSpacing: -0.5,
    },
    statSub: { fontSize: 12, fontWeight: "500", color: c.text3, marginTop: 4 },

    actionSection: { marginHorizontal: 20, marginTop: 12 },

    btnPrimary: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: c.text,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    btnPrimaryText: { fontSize: 15, fontWeight: "700", letterSpacing: 0.5 },

    btnToggle: {
      paddingVertical: 18,
      borderRadius: 14,
      alignItems: "center",
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    btnToggleText: { fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },

    btnOutline: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: c.border2,
      backgroundColor: c.bg,
    },
    btnOutlineText: {
      fontSize: 14,
      fontWeight: "700",
      color: c.text,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });
}
