import type { CSSProperties } from "react";

// Recharts tooltips default to a white box, which glares in dark mode. These
// read the theme tokens from globals.css instead.
export const TOOLTIP_PROPS: {
  contentStyle: CSSProperties;
  itemStyle: CSSProperties;
  labelStyle: CSSProperties;
} = {
  contentStyle: {
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--ink)",
    boxShadow: "var(--shadow-md)",
  },
  itemStyle: { color: "var(--ink)" },
  labelStyle: { color: "var(--ink-3)", marginBottom: 2 },
};
