import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { ThemeMode } from "../lib/habits/types";

const THEME_KEY = "@streaks/theme";

export type ThemeColors = {
  bg: string;
  bg2: string;
  bg3: string;
  card: string;
  text: string;
  text2: string;
  text3: string;
  border: string;
  border2: string;
  accent: string;
  accentText: string;
  danger: string;
  success: string;
};

const LIGHT: ThemeColors = {
  bg: "#ffffff",
  bg2: "#f5f5f5",
  bg3: "#ebebeb",
  card: "#ffffff",
  text: "#0a0a0a",
  text2: "#555555",
  text3: "#888888",
  border: "#e0e0e0",
  border2: "#c8c8c8",
  accent: "#0a0a0a",
  accentText: "#ffffff",
  danger: "#e24b4a",
  success: "#1D9E75",
};

const DARK: ThemeColors = {
  bg: "#111111",
  bg2: "#1a1a1a",
  bg3: "#222222",
  card: "#1a1a1a",
  text: "#f0f0f0",
  text2: "#aaaaaa",
  text3: "#666666",
  border: "#2a2a2a",
  border2: "#3a3a3a",
  accent: "#f0f0f0",
  accentText: "#111111",
  danger: "#e24b4a",
  success: "#1D9E75",
};

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  colors: LIGHT,
  setMode: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v === "light" || v === "dark" || v === "system") {
        setModeState(v);
      }
    });
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(THEME_KEY, m);
  };

  let colors: ThemeColors;
  let isDark = false;

  if (mode === "light") {
    colors = LIGHT;
  } else if (mode === "dark") {
    colors = DARK;
    isDark = true;
  } else {
    isDark = systemScheme === "dark";
    colors = isDark ? DARK : LIGHT;
  }

  return (
    <ThemeContext.Provider value={{ mode, colors, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
