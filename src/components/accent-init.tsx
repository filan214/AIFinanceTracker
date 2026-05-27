"use client";

import { useEffect } from "react";

const ACCENT_MAP: Record<string, string> = {
  "#10b981": "#34d399",
  "#6366f1": "#818cf8",
  "#f43f5e": "#fb7185",
  "#f59e0b": "#fbbf24",
  "#3b82f6": "#60a5fa",
};

export function AccentInit() {
  useEffect(() => {
    const color = localStorage.getItem("accent-color");
    if (color) {
      document.documentElement.style.setProperty("--accent", color);
      document.documentElement.style.setProperty(
        "--accent-2",
        ACCENT_MAP[color] || color
      );
    }
  }, []);
  return null;
}
