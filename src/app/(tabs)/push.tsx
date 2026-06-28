import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../components/ThemeContext";
import { usePushNotifications } from "../../hooks/use-push-notifications";
import { NotificationData } from "../../lib/habits/types";

type ReceivedEntry = {
  id: string;
  title: string;
  body: string;
  receivedAt: string;
  appState: "foreground" | "background/killed";
  habitId?: string;
};

export default function PushScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, tokenError, registering, register, permissionStatus } =
    usePushNotifications();

  const [received, setReceived] = useState<ReceivedEntry[]>([]);
  const listenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    listenerRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as
          | NotificationData
          | undefined;
        setReceived((prev) => [
          {
            id: notification.request.identifier,
            title: notification.request.content.title ?? "(no title)",
            body: notification.request.content.body ?? "",
            receivedAt: new Date().toLocaleTimeString(),
            appState: "foreground",
            habitId: data?.habitId,
          },
          ...prev.slice(0, 19),
        ]);
      },
    );

    const response = Notifications.getLastNotificationResponse();

    if (response) {
      const n = response.notification;
      const data = n.request.content.data as NotificationData | undefined;

      setReceived((prev) => {
        if (prev.some((e) => e.id === n.request.identifier)) {
          return prev;
        }

        return [
          {
            id: n.request.identifier,
            title: n.request.content.title ?? "(no title)",
            body: n.request.content.body ?? "",
            receivedAt: new Date().toLocaleTimeString(),
            appState: "background/killed",
            habitId: data?.habitId,
          },
          ...prev,
        ];
      });
    }

    return () => {
      listenerRef.current?.remove();
    };
  }, []);

  const copyToken = async () => {
    if (!token) return;
    await Clipboard.setStringAsync(token);
    Alert.alert("Copied", "Push token copied to clipboard.");
  };

  const c = colors;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 1,
            color: c.text3,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          SERVER PUSH
        </Text>
        <Text style={{ fontSize: 32, fontWeight: "700", color: c.text }}>
          Push
        </Text>
      </View>
      <View style={{ height: 0.5, backgroundColor: c.border }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View
          style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: c.text3,
              marginBottom: 12,
            }}
          >
            Status
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: c.bg2,
              borderRadius: 10,
              padding: 14,
              borderWidth: 0.5,
              borderColor: c.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "500", color: c.text }}>
              Notification permission
            </Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 20,
                backgroundColor:
                  permissionStatus === "granted" ? c.success : c.danger,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#fff",
                  letterSpacing: 0.5,
                }}
              >
                {permissionStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: c.text3,
              marginBottom: 12,
            }}
          >
            Expo Push Token
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: c.text3,
              lineHeight: 18,
              marginBottom: 12,
            }}
          >
            Push notifications do NOT work in Expo Go. Build with EAS ({" "}
            <Text
              style={{
                fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                color: c.text2,
              }}
            >
              eas build --profile development
            </Text>{" "}
            ) to get a real token.
          </Text>

          <TouchableOpacity
            style={{
              padding: 14,
              borderRadius: 8,
              backgroundColor: c.text,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
            onPress={register}
            disabled={registering}
            activeOpacity={0.85}
          >
            {registering ? (
              <ActivityIndicator color={c.bg} size="small" />
            ) : (
              <>
                <Ionicons
                  name="phone-portrait-outline"
                  size={18}
                  color={c.bg}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: c.bg,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Register for Push
                </Text>
              </>
            )}
          </TouchableOpacity>

          {token && (
            <View style={{ marginTop: 12 }}>
              <View
                style={{
                  backgroundColor: c.bg2,
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 0.5,
                  borderColor: c.border,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                    color: c.text2,
                    lineHeight: 18,
                  }}
                >
                  {token}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  padding: 12,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  borderWidth: 0.5,
                  borderColor: c.border2,
                }}
                onPress={copyToken}
              >
                <Ionicons name="copy-outline" size={16} color={c.text} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: c.text,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Copy Token
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {tokenError && (
            <View
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 8,
                backgroundColor: c.bg2,
                borderWidth: 0.5,
                borderColor: c.danger,
              }}
            >
              <Text style={{ fontSize: 12, color: c.danger, lineHeight: 18 }}>
                {tokenError}
              </Text>
            </View>
          )}
        </View>

        <View style={{ marginHorizontal: 20, marginTop: 8, marginBottom: 4 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: c.text3,
              marginBottom: 12,
            }}
          >
            How to test
          </Text>
          <View
            style={{
              backgroundColor: c.bg2,
              borderRadius: 10,
              padding: 14,
              borderWidth: 0.5,
              borderColor: c.border,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: c.text,
                marginBottom: 6,
              }}
            >
              Option A — expo.dev/notifications
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: c.text3,
                lineHeight: 18,
                marginBottom: 12,
              }}
            >
              Paste your token into the Expo push tool and send with this JSON
              body:
            </Text>
            <View
              style={{
                backgroundColor: c.bg3,
                borderRadius: 6,
                padding: 10,
                borderWidth: 0.5,
                borderColor: c.border,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                  color: c.text2,
                  lineHeight: 18,
                }}
              >
                {`{\n  "title": "Habit reminder 🔔",\n  "body": "Tap to log it.",\n  "data": {\n    "screen": "/habit",\n    "habitId": "YOUR_HABIT_ID"\n  }\n}`}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: c.text,
                marginTop: 14,
                marginBottom: 6,
              }}
            >
              Option B — cURL
            </Text>
            <View
              style={{
                backgroundColor: c.bg3,
                borderRadius: 6,
                padding: 10,
                borderWidth: 0.5,
                borderColor: c.border,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                  color: c.text2,
                  lineHeight: 16,
                }}
              >
                {`curl -X POST https://exp.host/--/api/v2/push/send \\\n  -H "Content-Type: application/json" \\\n  -d '{"to":"TOKEN","title":"Habit 🔔","body":"Tap to log.","data":{"screen":"/habit","habitId":"ID"}}'`}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: c.text,
                marginTop: 14,
                marginBottom: 6,
              }}
            >
              Option C — Node.js server
            </Text>
            <Text style={{ fontSize: 12, color: c.text3, lineHeight: 18 }}>
              Run{" "}
              <Text
                style={{
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                  color: c.text2,
                }}
              >
                node push-server/send.js
              </Text>{" "}
              from the repo root. Handles tickets, receipts, and
              DeviceNotRegistered drops automatically.
            </Text>
          </View>
        </View>

        <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 4 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: c.text3,
              marginBottom: 12,
            }}
          >
            Foreground vs background
          </Text>
          <View style={{ gap: 8 }}>
            {[
              {
                label: "Foreground (app open)",
                icon: "phone-portrait-outline" as const,
                desc: "The foreground handler fires. A banner is shown because shouldShowAlert: true. The received log below updates immediately. Tapping the banner calls the shared handleNotificationResponse() and navigates to habit/[id].",
                color: c.success,
              },
              {
                label: "Background (app running, not focused)",
                icon: "eye-off-outline" as const,
                desc: "OS shows a system banner. When the user taps it, the app resumes and addNotificationResponseReceivedListener fires, navigating to habit/[id] via the shared handler.",
                color: c.text3,
              },
              {
                label: "Killed (app closed)",
                icon: "power-outline" as const,
                desc: "OS shows a system banner. On next launch, getLastNotificationResponseAsync() returns the tapped response and navigates immediately. This screen also shows it in the log below.",
                color: c.danger,
              },
            ].map((item) => (
              <View
                key={item.label}
                style={{
                  backgroundColor: c.bg2,
                  borderRadius: 10,
                  padding: 14,
                  borderWidth: 0.5,
                  borderColor: c.border,
                  flexDirection: "row",
                  gap: 12,
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.color}
                  style={{ marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: c.text,
                      marginBottom: 4,
                    }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: c.text3, lineHeight: 18 }}
                  >
                    {item.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginHorizontal: 20, marginTop: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: c.text3,
              }}
            >
              Received pushes ({received.length})
            </Text>
            {received.length > 0 && (
              <TouchableOpacity onPress={() => setReceived([])}>
                <Text
                  style={{ fontSize: 12, color: c.danger, fontWeight: "600" }}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {received.length === 0 ? (
            <View
              style={{
                padding: 20,
                borderRadius: 10,
                backgroundColor: c.bg2,
                borderWidth: 0.5,
                borderColor: c.border,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: c.text,
                  marginBottom: 4,
                }}
              >
                No pushes received yet
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: c.text3,
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                Send a test push using the instructions above. Received pushes
                appear here with their app state.
              </Text>
            </View>
          ) : (
            received.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={{
                  backgroundColor: c.bg2,
                  borderRadius: 10,
                  padding: 14,
                  borderWidth: 0.5,
                  borderColor: c.border,
                  marginBottom: 8,
                }}
                onPress={() => {
                  if (entry.habitId && entry.habitId !== "test") {
                    router.push(`/habit/${entry.habitId}`);
                  }
                }}
                activeOpacity={entry.habitId ? 0.7 : 1}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: c.text,
                      flex: 1,
                    }}
                  >
                    {entry.title}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                      marginLeft: 8,
                      backgroundColor:
                        entry.appState === "foreground" ? c.success : c.text3,
                    }}
                  >
                    <Text
                      style={{ fontSize: 10, fontWeight: "700", color: "#fff" }}
                    >
                      {entry.appState === "foreground"
                        ? "FOREGROUND"
                        : "BG/KILLED"}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: c.text3, marginBottom: 4 }}>
                  {entry.body}
                </Text>
                <Text style={{ fontSize: 11, color: c.text3 }}>
                  Received at {entry.receivedAt}
                </Text>
                {entry.habitId && (
                  <Text
                    style={{
                      fontSize: 10,
                      marginTop: 6,
                      fontFamily:
                        Platform.OS === "ios" ? "Courier" : "monospace",
                      color: c.text3,
                    }}
                  >
                    habitId: {entry.habitId}
                    {entry.habitId !== "test"
                      ? "  · tap to open →"
                      : "  · (test id, no habit)"}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
