import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const CHANNEL_ID = "streaks-reminders";
export const CHANNEL_NAME = "Streaks Reminders";

export async function createAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: CHANNEL_NAME,
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#0a0a0a",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableVibrate: true,
    showBadge: true,
  });
}

export type PermissionStatus = "granted" | "denied" | "undetermined";

export async function getPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionStatus;
}

export async function requestPermission(): Promise<PermissionStatus> {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return status as PermissionStatus;
}

export function setupForegroundHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function initNotifications(): Promise<PermissionStatus> {
  setupForegroundHandler();

  await createAndroidChannel();

  const current = await getPermissionStatus();
  if (current === "undetermined") {
    return requestPermission();
  }
  return current;
}
