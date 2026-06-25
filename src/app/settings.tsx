import { View, Text, StyleSheet, Pressable, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { usePushNotifications } from '../hooks/use-push-notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const { expoPushToken, hasPermission } = usePushNotifications();

  const handleCopyToken = async () => {
    if (expoPushToken) {
      await Clipboard.setStringAsync(expoPushToken);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const openSystemSettings = async () => {
    await Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#888888" />
        </Pressable>
        <Text style={styles.headerTitle}>System Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notification Engine</Text>
          
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>OS Permission</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: hasPermission ? '#32D74B' : '#FF453A' }]} />
                <Text style={styles.statusText}>{hasPermission ? 'Granted' : 'Denied'}</Text>
              </View>
            </View>
            
            {!hasPermission && (
              <Pressable style={styles.actionButton} onPress={openSystemSettings}>
                <Text style={styles.actionButtonText}>Open Device Settings</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Push Delivery Network</Text>
          <View style={styles.card}>
            <Text style={styles.rowLabel}>Expo Push Token</Text>
            <Text style={styles.tokenText} selectable={true}>
              {expoPushToken ? expoPushToken : 'Generating token... (Requires EAS build)'}
            </Text>
            
            <Pressable 
              style={[styles.actionButton, !expoPushToken && styles.actionButtonDisabled]} 
              onPress={handleCopyToken}
              disabled={!expoPushToken}
            >
              <Ionicons name="copy-outline" size={18} color="#000000" />
              <Text style={styles.actionButtonText}>Copy to Clipboard</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  content: { padding: 20 },
  section: { marginBottom: 32 },
  sectionLabel: {
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1A1C1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  tokenText: {
    color: '#888888',
    fontSize: 13,
    fontFamily: 'monospace',
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#32D74B',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  actionButtonDisabled: { backgroundColor: '#333333' },
  actionButtonText: { color: '#000000', fontWeight: 'bold', fontSize: 15 },
});