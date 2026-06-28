import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type PushRegistrationResult =
  | { success: true; token: string }
  | { success: false; error: string };

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return {
      success: false,
      error: "Push notifications require a physical device.",
    };
  }

  const isExpoGo = Constants.appOwnership === "expo";
  if (isExpoGo) {
    return {
      success: false,
      error:
        "Push notifications do NOT work in Expo Go. " +
        "Create a development build with EAS to get an Expo push token.",
    };
  }

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("streaks-reminders", {
        name: "Habit Reminders",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      return {
        success: false,
        error:
          "EAS project ID not found. Add it to app.json → extra.eas.projectId.",
      };
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    return { success: true, token: tokenData.data };
  } catch (e: any) {
    return {
      success: false,
      error: e?.message ?? "Failed to get push token.",
    };
  }
}

export const PUSH_SEND_ENDPOINT = "https://exp.host/--/api/v2/push/send";
