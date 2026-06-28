import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { NotificationData } from "../lib/habits/types";
import { registerForPushNotifications } from "../lib/notifications/push";
import {
  getPermissionStatus,
  PermissionStatus,
  requestPermission,
} from "../lib/notifications/setup";

type PushState = {
  token: string | null;
  tokenError: string | null;
  registering: boolean;
  permissionStatus: PermissionStatus;
};

export function usePushNotifications() {
  const router = useRouter();

  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const [state, setState] = useState<PushState>({
    token: null,
    tokenError: null,
    registering: false,
    permissionStatus: "undetermined",
  });

  const handleNotificationResponse = (
    response: Notifications.NotificationResponse,
  ) => {
    const data = response.notification.request.content.data as
      | NotificationData
      | undefined
      | null;

    if (!data) return;

    if (
      data.screen === "/habit" &&
      typeof data.habitId === "string" &&
      data.habitId.length > 0
    ) {
      router.push(`/habit/${data.habitId}`);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getPermissionStatus().then((status) => {
      if (isMounted) setState((s) => ({ ...s, permissionStatus: status }));
    });

    const response = Notifications.getLastNotificationResponse();

    if (response && isMounted) {
      setTimeout(() => {
        if (isMounted) {
          handleNotificationResponse(response);
        }
      }, 0);
    }

    notificationListener.current =
      Notifications.addNotificationReceivedListener((_notification) => {});

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse,
      );

    return () => {
      isMounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
