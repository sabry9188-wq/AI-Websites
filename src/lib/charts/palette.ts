/** Validated categorical/status colors for charts, light and dark variants.
 * Assigned in a fixed order per series — never reshuffled when a filter
 * changes which categories are visible. */

export const CATEGORICAL_LIGHT = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
] as const;

export const CATEGORICAL_DARK = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
] as const;

/** Reserved for state, never reused as a categorical series color. Always
 * paired with an icon + label, not color alone. Same hex in both themes. */
export const STATUS_COLORS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export const CHART_CHROME_LIGHT = {
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  mutedText: "#898781",
  tooltipBg: "#fcfcfb",
  tooltipText: "#0b0b0b",
};

export const CHART_CHROME_DARK = {
  grid: "#2c2c2a",
  axis: "#383835",
  mutedText: "#898781",
  tooltipBg: "#1a1a19",
  tooltipText: "#ffffff",
};

export function categoricalColors(isDark: boolean) {
  return isDark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}

export function chartChrome(isDark: boolean) {
  return isDark ? CHART_CHROME_DARK : CHART_CHROME_LIGHT;
}
