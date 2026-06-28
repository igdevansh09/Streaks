import DateTimePicker from "@expo/ui/community/datetime-picker";
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

import { useTheme } from "../components/ThemeContext";
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
  const [time, setTime] = useState(new Date(0, 0, 0, 9, 0));
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!editId) return;
    getHabit(editId).then((h) => {
      if (h) {
        setName(h.name);
        setEmoji(h.emoji);
        setFreqKind(h.frequency.kind);
        if (h.frequency.kind === "weekly") setWeekdays(h.frequency.weekdays);
        setTime(new Date(0, 0, 0, h.frequency.hour, h.frequency.minute));
      }
      setLoading(false);
    });
  }, [editId]);

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(),
    );
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter a habit name.");
      return;
    }
    if (freqKind === "weekly" && weekdays.length === 0) {
      Alert.alert(
        "Select days",
        "Pick at least one weekday for a weekly habit.",
      );
      return;
    }

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
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save habit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.bg2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
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
            {EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[
                  s.emojiBtn,
                  emoji === e && {
                    borderColor: colors.text,
                    backgroundColor: colors.bg3,
                  },
                ]}
                onPress={() => setEmoji(e)}
              >
                <Text style={{ fontSize: 20 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Frequency */}
        <View style={s.section}>
          <Text style={s.label}>Frequency</Text>
          <View style={s.freqRow}>
            {(["daily", "weekly"] as const).map((k) => (
              <TouchableOpacity
                key={k}
                style={[
                  s.freqBtn,
                  freqKind === k && {
                    backgroundColor: colors.text,
                    borderColor: colors.text,
                  },
                ]}
                onPress={() => setFreqKind(k)}
              >
                <Text
                  style={[
                    s.freqBtnText,
                    freqKind === k && { color: colors.bg },
                  ]}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {freqKind === "weekly" && (
            <>
              <Text style={[s.label, { marginTop: 12 }]}>Days</Text>
              <View style={s.weekdayRow}>
                {WEEKDAY_LABELS.map((label, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      s.weekdayBtn,
                      weekdays.includes(i) && {
                        backgroundColor: colors.text,
                        borderColor: colors.text,
                      },
                    ]}
                    onPress={() => toggleWeekday(i)}
                  >
                    <Text
                      style={[
                        s.weekdayBtnText,
                        weekdays.includes(i) && { color: colors.bg },
                      ]}
                    >
                      {label.charAt(0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Time */}
        <View style={s.section}>
          <Text style={s.label}>Reminder time</Text>
          <TouchableOpacity
            style={s.timeRow}
            onPress={() => setShowPicker(true)}
          >
            <Text style={s.timeText}>
              {String(time.getHours()).padStart(2, "0")}:
              {String(time.getMinutes()).padStart(2, "0")}
            </Text>
            <Text style={{ fontSize: 12, color: colors.text3 }}>
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
        <View style={s.section}>
          <TouchableOpacity
            style={s.btnPrimary}
            onPress={handleSave}
            disabled={saving}
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
            <TouchableOpacity style={s.btnDanger} onPress={handleDelete}>
              <Text style={[s.btnText, { color: colors.danger }]}>
                Delete habit
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.btnOutline} onPress={() => router.back()}>
            <Text style={[s.btnText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: any) {
  return StyleSheet.create({
    modalTitle: { fontSize: 20, fontWeight: "700", color: c.text },
    section: { paddingHorizontal: 20, paddingBottom: 16 },
    label: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: c.text3,
      marginBottom: 8,
    },
    input: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: c.border2,
      backgroundColor: c.bg2,
      color: c.text,
      fontSize: 15,
    },
    emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    emojiBtn: {
      width: 44,
      height: 44,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: c.border,
      backgroundColor: c.bg2,
      alignItems: "center",
      justifyContent: "center",
    },
    freqRow: { flexDirection: "row", gap: 8 },
    freqBtn: {
      flex: 1,
      padding: 10,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: c.border2,
      backgroundColor: c.bg2,
      alignItems: "center",
    },
    freqBtnText: { fontSize: 13, fontWeight: "500", color: c.text2 },
    weekdayRow: { flexDirection: "row", gap: 6 },
    weekdayBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: c.border2,
      backgroundColor: c.bg2,
      alignItems: "center",
    },
    weekdayBtnText: { fontSize: 12, fontWeight: "600", color: c.text2 },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: c.border2,
      backgroundColor: c.bg2,
    },
    timeText: {
      fontSize: 22,
      fontWeight: "700",
      color: c.text,
      fontVariant: ["tabular-nums"],
    },
    btnPrimary: {
      padding: 14,
      borderRadius: 8,
      backgroundColor: c.text,
      alignItems: "center",
    },
    btnDanger: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: c.danger,
      alignItems: "center",
      marginTop: 10,
    },
    btnOutline: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: c.border2,
      alignItems: "center",
      marginTop: 10,
    },
    btnText: {
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
  });
}
