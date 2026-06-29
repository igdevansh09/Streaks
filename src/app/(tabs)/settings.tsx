import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../context/ThemeContext";
import { usePushNotifications } from "../../hooks/use-push-notifications";
import { ThemeMode } from "../../lib/habits/types";
import { cancelAllScheduled, getAllScheduledCount } from "../../lib/notifications/schedule";
import { getPermissionStatus, PermissionStatus, requestPermission } from "../../lib/notifications/setup";

function triggerHaptic(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  if (Platform.OS !== "web") Haptics.impactAsync(style);
}

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { token, tokenError, registering, register } = usePushNotifications();
  const s = makeStyles(colors);

  const [permStatus, setPermStatus] = useState<PermissionStatus>("undetermined");
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    getPermissionStatus().then(setPermStatus);
    refreshCount();
  }, []);

  const refreshCount = async () => {
    const n = await getAllScheduledCount();
    setNotifCount(n);
  };

  const handleRequestPerm = async () => {
    triggerHaptic();
    const status = await requestPermission();
    setPermStatus(status);
  };

  const handleFireTest = async () => {
    triggerHaptic();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 Test notification",
        body: "Deep link tap → habit detail screen.",
        data: { screen: "/habit", habitId: "test" },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
    });
    Alert.alert("Scheduled", "Test notification fires in 3 seconds.");
    setTimeout(refreshCount, 500);
  };

  const handleCopyToken = async () => {
    if (token) {
      await Clipboard.setStringAsync(token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Copied", "Push token copied to clipboard.");
    }
  };

  const themes: { label: string; val: ThemeMode }[] = [
    { label: "Light", val: "light" },
    { label: "Dark", val: "dark" },
    { label: "System", val: "system" },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        
        {/* Appearance */}
        <Text style={s.sectionLabel}>Appearance</Text>
        <View style={s.themeRow}>
          {themes.map((t) => (
            <TouchableOpacity
              key={t.val}
              onPress={() => {
                triggerHaptic();
                setMode(t.val);
              }}
              style={[s.themeBtn, mode === t.val && s.themeBtnActive]}
              activeOpacity={0.7}
            >
              <Text style={[s.themeBtnText, mode === t.val && s.themeBtnTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications */}
        <Text style={s.sectionLabel}>Notifications</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowText}>Permission</Text>
            <View style={[s.badge, { backgroundColor: permStatus === 'granted' ? colors.success : colors.danger }]}>
              <Text style={s.badgeText}>{permStatus.toUpperCase()}</Text>
            </View>
          </View>
          
          {permStatus !== "granted" && (
            <TouchableOpacity style={s.btnPrimary} onPress={handleRequestPerm} activeOpacity={0.8}>
              <Text style={s.btnPrimaryText}>Request Permission</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={s.btnOutline} 
            onPress={() => { triggerHaptic(); Linking.openSettings(); }} 
            activeOpacity={0.7}
          >
            <Text style={s.btnOutlineText}>Open System Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Push Token */}
        <Text style={s.sectionLabel}>Push Token</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.btnPrimary} onPress={register} activeOpacity={0.8}>
            {registering ? <ActivityIndicator color={colors.bg} /> : <Text style={s.btnPrimaryText}>Register for Push</Text>}
          </TouchableOpacity>
          
          {token && (
            <>
              <View style={s.tokenBox}>
                <Text style={s.tokenText}>{token}</Text>
              </View>
              <TouchableOpacity style={s.btnOutline} onPress={handleCopyToken} activeOpacity={0.7}>
                <Ionicons name="copy-outline" size={16} color={colors.text} />
                <Text style={s.btnOutlineText}>Copy Token</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Debug */}
        <Text style={s.sectionLabel}>Debug</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowText}>Scheduled Notifications</Text>
            <Text style={s.rowValue}>{notifCount}</Text>
          </View>
          <TouchableOpacity style={s.btnOutline} onPress={handleFireTest} activeOpacity={0.7}>
            <Text style={s.btnOutlineText}>Fire Test Notification</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={s.btnDanger} 
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
              Alert.alert("Cancel All", "Remove all scheduled reminders?", [
                { text: "Cancel" },
                { text: "Delete", style: "destructive", onPress: async () => { await cancelAllScheduled(); refreshCount(); } }
              ]);
            }} 
            activeOpacity={0.7}
          >
            <Text style={s.btnDangerText}>Cancel All Notifications</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
    title: { fontSize: 32, fontWeight: "800", color: c.text, letterSpacing: -1 },
    scrollContent: { paddingBottom: 60, paddingHorizontal: 20 },
    sectionLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, color: c.text3, marginTop: 24, marginBottom: 12 },
    
    card: { backgroundColor: c.bg2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border2, gap: 12 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    rowText: { fontSize: 15, fontWeight: "600", color: c.text },
    rowValue: { fontSize: 15, fontWeight: "700", color: c.text },
    
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
    
    themeRow: { flexDirection: "row", gap: 10 },
    themeBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border2, alignItems: "center" },
    themeBtnActive: { backgroundColor: c.text, borderColor: c.text },
    themeBtnText: { fontSize: 13, fontWeight: "600", color: c.text2 },
    themeBtnTextActive: { color: c.bg },
    
    btnPrimary: { padding: 14, borderRadius: 12, backgroundColor: c.text, alignItems: "center" },
    btnPrimaryText: { fontSize: 14, fontWeight: "700", color: c.bg, textTransform: "uppercase", letterSpacing: 0.5 },
    btnOutline: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.border2, alignItems: "center", flexDirection: 'row', justifyContent: 'center', gap: 8 },
    btnOutlineText: { fontSize: 14, fontWeight: "700", color: c.text, textTransform: "uppercase", letterSpacing: 0.5 },
    btnDanger: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.danger, alignItems: "center" },
    btnDangerText: { fontSize: 14, fontWeight: "700", color: c.danger, textTransform: "uppercase", letterSpacing: 0.5 },
    
    tokenBox: { backgroundColor: c.bg, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: c.border2 },
    tokenText: { fontSize: 11, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", color: c.text2, lineHeight: 18 },
  });
}