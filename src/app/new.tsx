import DateTimePicker from "@expo/ui/community/datetime-picker";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";
import { useHabits } from "../hooks/use-habits";
import { getHabit } from "../lib/habits/storage";
import { Frequency } from "../lib/habits/types";

const EMOJIS = [
  "💧",
  "📖",
  "🏋️",
  "🧘",
  "🎯",
  "🎸",
  "✍️",
  "🏃",
  "💊",
  "🧹",
  "🌿",
  "🍎",
  "💻",
  "🎨",
  "📝",
  "🔔",
  "⭐",
  "🌙",
  "☕",
  "🧠",
  "🎵",
  "🌱",
  "🦷",
  "😴",
  "🧴",
  "📱",
  "🛏️",
  "🚶",
  "🍵",
  "🧩",
];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const createSafeTime = (hours: number, minutes: number) => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

export default function NewHabitScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { createHabit, editHabit, deleteHabit } = useHabits();

  const isEditing = Boolean(editId);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💧");
  const [freqKind, setFreqKind] = useState<"daily" | "weekly">("daily");
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4]);

  const [time, setTime] = useState(createSafeTime(9, 0));
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!editId) return;
    getHabit(editId).then((h) => {
      if (h) {
        setName(h.name);
        setEmoji(h.emoji);
        setFreqKind(h.frequency.kind);
        if (h.frequency.kind === "weekly") setWeekdays(h.frequency.weekdays);
        setTime(createSafeTime(h.frequency.hour, h.frequency.minute));
      }
      setLoading(false);
    });
  }, [editId]);

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleWeekday = (day: number) => {
    triggerHaptic();
    setWeekdays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(),
    );
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Name required", "Please enter a habit name.");
      return;
    }
    if (freqKind === "weekly" && weekdays.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Select days",
        "Pick at least one weekday for a weekly habit.",
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const frequency: Frequency =
      freqKind === "daily"
        ? { kind: "daily", hour: time.getHours(), minute: time.getMinutes() }
        : {
            kind: "weekly",
            weekdays,
            hour: time.getHours(),
            minute: time.getMinutes(),
          };

    setSaving(true);
    try {
      if (isEditing && editId) {
        await editHabit({ id: editId, name: trimmed, emoji, frequency });
      } else {
        await createHabit({ name: trimmed, emoji, frequency });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to save habit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete habit?",
      `This will permanently remove "${name}" and cancel all its reminders.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (editId) {
              await deleteHabit(editId);
              router.back();
            }
          },
        },
      ],
    );
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
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  const s = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 12,
        }}
      >
        <Text style={s.modalTitle}>
          {isEditing ? "Edit habit" : "New habit"}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Text style={{ fontSize: 18, color: colors.text2 }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Name */}
        <View style={s.section}>
          <Text style={s.label}>Habit name</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Drink Water"
            placeholderTextColor={colors.text3}
            maxLength={40}
            autoCapitalize="words"
          />
        </View>

        {/* Emoji */}
        <View style={s.section}>
          <Text style={s.label}>Icon</Text>
          <View style={s.emojiGrid}>
            {EMOJIS.map((e) => {
              const isSelected = emoji === e;
              return (
                <TouchableOpacity
                  key={e}
                  style={[
                    s.emojiBtn,
                    isSelected && {
                      borderColor: colors.text,
                      backgroundColor: colors.bg3,
                      transform: [{ scale: 1.05 }],
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setEmoji(e);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20 }}>{e}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Frequency */}
        <View style={s.section}>
          <Text style={s.label}>Frequency</Text>
          <View style={s.freqRow}>
            {(["daily", "weekly"] as const).map((k) => {
              const isSelected = freqKind === k;
              return (
                <TouchableOpacity
                  key={k}
                  style={[
                    s.freqBtn,
                    isSelected && {
                      backgroundColor: colors.text,
                      borderColor: colors.text,
                    },
                  ]}
                  onPress={() => {
                    if (freqKind !== k) triggerHaptic();
                    setFreqKind(k);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[s.freqBtnText, isSelected && { color: colors.bg }]}
                  >
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {freqKind === "weekly" && (
            <>
              <Text style={[s.label, { marginTop: 16 }]}>Days</Text>
              <View style={s.weekdayRow}>
                {WEEKDAY_LABELS.map((label, i) => {
                  const isSelected = weekdays.includes(i);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        s.weekdayBtn,
                        isSelected && {
                          backgroundColor: colors.text,
                          borderColor: colors.text,
                        },
                      ]}
                      onPress={() => toggleWeekday(i)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          s.weekdayBtnText,
                          isSelected && { color: colors.bg },
                        ]}
                      >
                        {label.charAt(0)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Time */}
        <View style={s.section}>
          <Text style={s.label}>Reminder time</Text>
          <TouchableOpacity
            style={s.timeRow}
            onPress={() => {
              triggerHaptic();
              setShowPicker(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={s.timeText}>
              {String(time.getHours()).padStart(2, "0")}:
              {String(time.getMinutes()).padStart(2, "0")}
            </Text>
            <Text
              style={{ fontSize: 12, color: colors.text3, fontWeight: "600" }}
            >
              Tap to change
            </Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onValueChange={(_, selectedDate) => {
                if (selectedDate) {
                  setTime(selectedDate);
                }
                if (Platform.OS !== "ios") {
                  setShowPicker(false);
                }
              }}
            />
          )}
        </View>

        {/* Actions */}
        <View style={[s.section, { marginTop: 10 }]}>
          <TouchableOpacity
            style={s.btnPrimary}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={colors.bg} size="small" />
            ) : (
              <Text style={[s.btnText, { color: colors.bg }]}>
                {isEditing ? "Update habit" : "Save habit"}
              </Text>
            )}
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              style={s.btnDanger}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Text style={[s.btnText, { color: colors.danger }]}>
                Delete habit
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={s.btnOutline}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={[s.btnText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: any) {
  return StyleSheet.create({
    modalTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: c.text,
      letterSpacing: -0.5,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.bg2,
      alignItems: "center",
      justifyContent: "center",
    },
    section: { paddingHorizontal: 20, paddingBottom: 24 },
    label: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: c.text3,
      marginBottom: 10,
    },
    input: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border2,
      backgroundColor: c.bg2,
      color: c.text,
      fontSize: 16,
      fontWeight: "500",
    },
    emojiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "center",
    },
    emojiBtn: {
      width: 48,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg2,
      alignItems: "center",
      justifyContent: "center",
    },
    freqRow: { flexDirection: "row", gap: 10 },
    freqBtn: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border2,
      backgroundColor: c.bg2,
      alignItems: "center",
    },
    freqBtnText: { fontSize: 15, fontWeight: "600", color: c.text2 },
    weekdayRow: { flexDirection: "row", gap: 8 },
    weekdayBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border2,
      backgroundColor: c.bg2,
      alignItems: "center",
    },
    weekdayBtnText: { fontSize: 14, fontWeight: "700", color: c.text2 },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border2,
      backgroundColor: c.bg2,
    },
    timeText: {
      fontSize: 26,
      fontWeight: "700",
      color: c.text,
      fontVariant: ["tabular-nums"],
      letterSpacing: -0.5,
    },
    btnPrimary: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: c.text,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    btnDanger: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.danger,
      alignItems: "center",
      marginTop: 12,
    },
    btnOutline: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border2,
      alignItems: "center",
      marginTop: 12,
    },
    btnText: {
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
  });
}
