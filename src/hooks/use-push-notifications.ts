// src/hooks/use-push-notifications.ts
import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter, Href } from 'expo-router'; 
import { checkAndRequestPermissions } from '../lib/notifications/setup';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const router = useRouter();
  
const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    async function setupRegistration() {
      const allowed = await checkAndRequestPermissions();
      setHasPermission(allowed);

      if (!allowed) return;

      try {
        const projectId = 
          Constants.expoConfig?.extra?.eas?.projectId ?? 
          Constants.easConfig?.projectId;
          
        if (!projectId) {
          console.warn("EAS Project ID configuration missing. Verify app.json parameters.");
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        setExpoPushToken(tokenData.data);
      } catch (err) {
        console.error('Failed acquiring Expo Push Token:', err);
      }
    }

    setupRegistration();

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && data.screen) {
        router.push(data.screen as Href); 
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove(); 
      }
    };
  }, [router]);

  return { expoPushToken, hasPermission };
}