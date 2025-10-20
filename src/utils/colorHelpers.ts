/**
 * Color Helpers
 *
 * Utilities for color normalization and conversion
 */

const COLOR_MAP: Record<string, string> = {
  red: "#FF0000",
  blue: "#0000FF",
  green: "#00FF00",
  yellow: "#FFFF00",
  orange: "#FFA500",
  purple: "#800080",
  pink: "#FFC0CB",
  black: "#000000",
  white: "#FFFFFF",
  gray: "#808080",
  grey: "#808080",
  brown: "#A52A2A",
  cyan: "#00FFFF",
  magenta: "#FF00FF",
};

/**
 * Normalize a color name or hex code to uppercase hex format
 * @param color - Color name (e.g., "red") or hex code (e.g., "#FF0000")
 * @returns Normalized hex color code in uppercase, or undefined if input is empty
 */
export function normalizeColor(color?: string): string | undefined {
  if (!color) return undefined;

  const trimmed = color.trim();

  // If it's already a hex code, return it in uppercase
  if (/^#[0-9a-f]{3,6}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Support rgb()/rgba()
  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|0?\.\d+|1))?\s*\)$/i
  );
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1], 10)));
    const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2], 10)));
    const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3], 10)));
    const hex = `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
    return hex;
  }

  // Support hsl()/hsla()
  const hslMatch = trimmed.match(
    /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*(0|0?\.\d+|1))?\s*\)$/i
  );
  if (hslMatch) {
    let h = Math.max(0, Math.min(360, parseInt(hslMatch[1], 10))) / 360;
    let s = Math.max(0, Math.min(100, parseInt(hslMatch[2], 10))) / 100;
    let l = Math.max(0, Math.min(100, parseInt(hslMatch[3], 10))) / 100;
    // Convert HSL to RGB
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = (v: number) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  // Try to find the color name in the map
  const normalized = COLOR_MAP[trimmed.toLowerCase()];
  if (normalized) {
    return normalized;
  }

  // Modified names like "light blue", "dark red", "bright purple"
  const modMatch = trimmed.match(/^(light|dark|bright)\s+([a-z]+)$/i);
  if (modMatch) {
    const mod = modMatch[1].toLowerCase();
    const base = modMatch[2].toLowerCase();
    const baseHex = COLOR_MAP[base];
    if (baseHex) {
      // Convert baseHex to HSL, tweak S/L, then back to hex
      const full = baseHex.replace(/^#/, "");
      const rr = parseInt(full.slice(0, 2), 16);
      const gg = parseInt(full.slice(2, 4), 16);
      const bb = parseInt(full.slice(4, 6), 16);
      // rgb -> hsl
      let r = rr / 255,
        g = gg / 255,
        b = bb / 255;
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      let h = 0,
        s = 0,
        l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }
      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);
      if (mod === "light") l = Math.min(100, l + 20);
      else if (mod === "dark") l = Math.max(0, l - 20);
      else if (mod === "bright") s = Math.min(100, s + 20);
      // hsl -> hex
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      let H = h / 360,
        S = s / 100,
        L = l / 100;
      let R: number, G: number, B: number;
      if (S === 0) {
        R = G = B = L;
      } else {
        const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
        const p = 2 * L - q;
        R = hue2rgb(p, q, H + 1 / 3);
        G = hue2rgb(p, q, H);
        B = hue2rgb(p, q, H - 1 / 3);
      }
      const toHex = (v: number) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, "0");
      return `#${toHex(R)}${toHex(G)}${toHex(B)}`.toUpperCase();
    }
  }

  // If not found, return the original in uppercase (could be a custom color)
  return trimmed.toUpperCase();
}

/**
 * Convert a color name to hex code
 * @param color - Color name (e.g., "red") or hex code
 * @returns Hex color code, defaults to red if unknown
 */
export function colorNameToHex(color: string): string {
  const trimmed = color.trim();

  // If it's already a hex code, return it
  if (/^#[0-9a-f]{3,6}$/i.test(trimmed)) {
    return trimmed;
  }

  // rgb()/rgba()
  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|0?\.\d+|1))?\s*\)$/i
  );
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1], 10)));
    const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2], 10)));
    const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3], 10)));
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
  }

  // hsl()/hsla()
  const hslMatch = trimmed.match(
    /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*(0|0?\.\d+|1))?\s*\)$/i
  );
  if (hslMatch) {
    const hex = normalizeColor(trimmed);
    if (hex) return hex;
  }

  // Modified names like "light blue"
  const modMatch = trimmed.match(/^(light|dark|bright)\s+([a-z]+)$/i);
  if (modMatch) {
    const hex = normalizeColor(trimmed);
    if (hex) return hex;
  }

  // Convert color name to hex, default to red
  return COLOR_MAP[trimmed.toLowerCase()] || "#FF0000";
}
