import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { initNotifications } from "../lib/notifications/setup";

function InnerLayout() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    initNotifications().catch((e: Error) =>
      console.warn("[_layout] initNotifications error:", e),
    );
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="habit/[id]"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="new"
          options={{ animation: "slide_from_bottom", presentation: "modal" }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <InnerLayout />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
