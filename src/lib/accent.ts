// Accent colors offered in Settings. The swatch hex is what localStorage keeps
// (unchanged from before); the name selects a [data-accent] block in
// globals.css, which holds the AA-safe shades for light and dark mode.
export const ACCENTS = [
  { name: "emerald", swatch: "#10b981" },
  { name: "indigo", swatch: "#6366f1" },
  { name: "rose", swatch: "#f43f5e" },
  { name: "amber", swatch: "#f59e0b" },
  { name: "blue", swatch: "#3b82f6" },
] as const;

export type AccentName = (typeof ACCENTS)[number]["name"];

const STORAGE_KEY = "accent-color";

export function readStoredAccent(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || ACCENTS[0].swatch;
  } catch {
    return ACCENTS[0].swatch;
  }
}

export function storeAccent(swatch: string) {
  try {
    localStorage.setItem(STORAGE_KEY, swatch);
  } catch {
    // Storage unavailable (private mode): the choice lasts for this page only.
  }
}

export function applyAccent(swatch: string) {
  const name = ACCENTS.find((a) => a.swatch === swatch)?.name ?? "emerald";
  const root = document.documentElement;
  if (name === "emerald") delete root.dataset.accent;
  else root.dataset.accent = name;
}
