import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { useTheme } from '../../components/ThemeContext';
import { usePushNotifications } from '../../hooks/use-push-notifications';
import {
  requestPermission,
  getPermissionStatus,
  PermissionStatus,
} from '../../lib/notifications/setup';
import {
  getAllScheduledCount,
  cancelAllScheduled,
} from '../../lib/notifications/schedule';
import { ThemeMode } from '../../lib/habits/types';

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
      <Text style={{
        fontSize: 11, fontWeight: '600', letterSpacing: 0.8,
        textTransform: 'uppercase', color: colors.text3,
      }}>
        {label}
      </Text>
    </View>
  );
}

function Row({ children, colors }: { children: React.ReactNode; colors: any }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 0.5, borderBottomColor: colors.border,
    }}>
      {children}
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={{ height: 0.5, backgroundColor: colors.border }} />;
}

type BtnVariant = 'dark' | 'outline' | 'danger';

function BlockBtn({
  label, onPress, variant = 'dark', colors, loading,
}: {
  label: string; onPress: () => void; variant?: BtnVariant;
  colors: any; loading?: boolean;
}) {
  const bg = variant === 'dark' ? colors.text : 'transparent';
  const textColor = variant === 'dark' ? colors.bg : variant === 'danger' ? colors.danger : colors.text;
  const border = variant === 'dark' ? colors.text : variant === 'danger' ? colors.danger : colors.border2;

  return (
    <TouchableOpacity
      style={{
        marginHorizontal: 20, marginTop: 10, padding: 14, borderRadius: 8,
        backgroundColor: bg, borderWidth: 0.5, borderColor: border,
        alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={{
          fontSize: 13, fontWeight: '700', letterSpacing: 0.5,
          color: textColor, textTransform: 'uppercase',
        }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}


export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { token, tokenError, registering, register } = usePushNotifications();

  const [permStatus, setPermStatus] = useState<PermissionStatus>('undetermined');
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
    const status = await requestPermission();
    setPermStatus(status);
  };

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const handleFireTest = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test notification',
        body: 'Deep link tap → habit detail screen.',
        data: { screen: '/habit', habitId: 'test' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
      },
    });
    Alert.alert('Scheduled', 'Test notification fires in 3 seconds.');
    setTimeout(refreshCount, 500);
  };

  const handleCancelAll = () => {
    Alert.alert(
      'Cancel all notifications?',
      'This will remove ALL scheduled reminders across every habit.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove all', style: 'destructive',
          onPress: async () => { await cancelAllScheduled(); refreshCount(); },
        },
      ],
    );
  };

  const handleCopyToken = async () => {
    if (token) {
      await Clipboard.setStringAsync(token);       
      Alert.alert('Copied', 'Push token copied to clipboard.');
    }
  };

  const permLabel =
    permStatus === 'granted' ? 'GRANTED' :
    permStatus === 'denied' ? 'DENIED' : 'UNDETERMINED';
  const permColor =
    permStatus === 'granted' ? colors.success :
    permStatus === 'denied' ? colors.danger : colors.text3;

  const themes: { label: string; val: ThemeMode }[] = [
    { label: 'Light', val: 'light' },
    { label: 'Dark', val: 'dark' },
    { label: 'System', val: 'system' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{
          fontSize: 11, fontWeight: '600', letterSpacing: 1, color: colors.text3,
          textTransform: 'uppercase', marginBottom: 4,
        }}>
          CONFIG
        </Text>
        <Text style={{ fontSize: 32, fontWeight: '700', color: colors.text }}>Settings</Text>
      </View>

      <Divider colors={colors} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Appearance ── */}
        <SectionLabel label="Appearance" colors={colors} />
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20 }}>
          {themes.map((t) => (
            <TouchableOpacity
              key={t.val}
              onPress={() => setMode(t.val)}
              style={{
                flex: 1, padding: 10, borderRadius: 8, alignItems: 'center',
                borderWidth: 0.5,
                borderColor: mode === t.val ? colors.text : colors.border2,
                backgroundColor: mode === t.val ? colors.text : colors.bg2,
              }}
            >
              <Text style={{
                fontSize: 12, fontWeight: '600',
                color: mode === t.val ? colors.bg : colors.text2,
              }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Divider colors={colors} />

        {/* ── Notifications ── */}
        <SectionLabel label="Notifications" colors={colors} />
        <Row colors={colors}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>Permission</Text>
          <View style={{
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: 20, backgroundColor: permColor,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>
              {permLabel}
            </Text>
          </View>
        </Row>

        {permStatus !== 'granted' && (
          <BlockBtn label="Request Permission" onPress={handleRequestPerm} variant="dark" colors={colors} />
        )}
        <BlockBtn label="Open System Settings" onPress={handleOpenSettings} variant="outline" colors={colors} />

        <Divider colors={colors} />

        {/* ── Push Token ── */}
        <SectionLabel label="Push Token" colors={colors} />
        <Text style={{ paddingHorizontal: 20, fontSize: 12, color: colors.text3, lineHeight: 18 }}>
          Push notifications do NOT work in Expo Go. Create a development build with EAS to get an Expo push token.
        </Text>

        <BlockBtn
          label={registering ? 'Registering…' : 'Register for Push'}
          onPress={register}
          variant="dark"
          colors={colors}
          loading={registering}
        />

        {token && (
          <View style={{ marginHorizontal: 20, marginTop: 10 }}>
            <View style={{
              backgroundColor: colors.bg2, borderRadius: 8, padding: 12,
              borderWidth: 0.5, borderColor: colors.border,
            }}>
              <Text style={{
                fontSize: 11,
                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                color: colors.text2, lineHeight: 18,
              }}>
                {token}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                marginTop: 8, padding: 12, borderRadius: 8, alignItems: 'center',
                flexDirection: 'row', justifyContent: 'center', gap: 6,
                borderWidth: 0.5, borderColor: colors.border2, backgroundColor: colors.bg,
              }}
              onPress={handleCopyToken}
            >
              <Ionicons name="copy-outline" size={16} color={colors.text} />
              <Text style={{
                fontSize: 13, fontWeight: '700', color: colors.text,
                letterSpacing: 0.5, textTransform: 'uppercase',
              }}>
                Copy Token
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {tokenError && (
          <Text style={{
            marginHorizontal: 20, marginTop: 8, fontSize: 12,
            color: colors.danger, lineHeight: 18,
          }}>
            {tokenError}
          </Text>
        )}

        <Divider colors={colors} />

        {/* ── Debug ── */}
        <SectionLabel label="Debug" colors={colors} />

        <Row colors={colors}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>
            Scheduled local notifications
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
            {notifCount}
          </Text>
        </Row>

        <Row colors={colors}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>Platform</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
            {Platform.OS.toUpperCase()}
          </Text>
        </Row>

        <BlockBtn label="Fire Test Local (3s)" onPress={handleFireTest} variant="dark" colors={colors} />
        <BlockBtn label="Refresh Count" onPress={refreshCount} variant="outline" colors={colors} />
        <BlockBtn label="Cancel All Scheduled" onPress={handleCancelAll} variant="danger" colors={colors} />
      </ScrollView>
    </View>
  );
}
