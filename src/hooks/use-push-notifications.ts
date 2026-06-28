import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { registerForPushNotifications } from '../lib/notifications/push';
import {
  getPermissionStatus,
  requestPermission,
  PermissionStatus,
} from '../lib/notifications/setup';
import { NotificationData } from '../lib/habits/types';

type PushState = {
  token: string | null;
  tokenError: string | null;
  registering: boolean;
  permissionStatus: PermissionStatus;
};

export function usePushNotifications() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const [state, setState] = useState<PushState>({
    token: null,
    tokenError: null,
    registering: false,
    permissionStatus: 'undetermined',
  });

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as
      | NotificationData
      | undefined
      | null;

    if (!data) return;

    if (
      data.screen === '/habit' &&
      typeof data.habitId === 'string' &&
      data.habitId.length > 0
    ) {
      router.push(`/habit/${data.habitId}`);
    }
  };

  useEffect(() => {
    getPermissionStatus().then((status) =>
      setState((s) => ({ ...s, permissionStatus: status })),
    );
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((_notification) => {
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse,
      );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const register = async (): Promise<void> => {
    setState((s) => ({ ...s, registering: true, tokenError: null }));

    const result = await registerForPushNotifications();

    if (result.success) {
      setState((s) => ({
        ...s,
        token: result.token,
        tokenError: null,
        registering: false,
      }));
    } else {
      setState((s) => ({
        ...s,
        tokenError: result.error,
        registering: false,
      }));
    }
  };

  const askPermission = async (): Promise<PermissionStatus> => {
    const status = await requestPermission();
    setState((s) => ({ ...s, permissionStatus: status }));
    return status;
  };

  return {
    token: state.token,
    tokenError: state.tokenError,
    registering: state.registering,
    permissionStatus: state.permissionStatus,
    register,
    askPermission,
  };
}