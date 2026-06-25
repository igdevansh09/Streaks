import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, StyleSheet } from 'react-native';

import { initializeDatabase } from '../lib/db/sqlite';
import { configureNotifications } from '../lib/notifications/setup';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    async function bootstrapApp() {
      try {
        await initializeDatabase();
        await configureNotifications();
        
      } catch (e) {
        console.error('Fatal architecture failure during bootstrap:', e);
        setFatalError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsEngineReady(true);
        await SplashScreen.hideAsync();
      }
    }

    bootstrapApp();
  }, []);

  if (fatalError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>System Failure</Text>
        <Text style={styles.errorText}>
          The application engine failed to initialize: {fatalError.message}
        </Text>
      </View>
    );
  }

  if (!isEngineReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="habit/[id]" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#000000',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#ffffff',
  },
});