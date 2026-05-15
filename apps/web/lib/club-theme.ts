/**
 * Club theming — style catalog, hex→HSL conversion, CSS variable generation.
 *
 * Used by the theme injection hook (useClubThemeInjection) and the
 * theme settings UI in /admin/account.
 */

// ---------- Style catalog (10 predefined visual styles) ----------

export type StyleDefinition = {
  id: number;
  name: string;
  radius: string;
  radiusLg: string;
  shadow: 'none' | 'xs' | 'sm' | 'md';
  borderWidth: '0px' | '1px' | '2px';
};

export const STYLE_CATALOG: StyleDefinition[] = [
  { id: 1, name: 'Classic', radius: '0.5rem', radiusLg: '0.75rem', shadow: 'sm', borderWidth: '1px' },
  { id: 2, name: 'Nordic', radius: '0.5rem', radiusLg: '0.75rem', shadow: 'xs', borderWidth: '0px' },
  { id: 3, name: 'Editorial', radius: '0px', radiusLg: '0px', shadow: 'none', borderWidth: '2px' },
  { id: 4, name: 'Glass', radius: '1rem', radiusLg: '1.25rem', shadow: 'md', borderWidth: '1px' },
  { id: 5, name: 'Dashboard', radius: '0.375rem', radiusLg: '0.5rem', shadow: 'sm', borderWidth: '1px' },
  { id: 6, name: 'Rounded', radius: '1.5rem', radiusLg: '1.5rem', shadow: 'sm', borderWidth: '1px' },
  { id: 7, name: 'Sharp', radius: '0.125rem', radiusLg: '0.25rem', shadow: 'sm', borderWidth: '1px' },
  { id: 8, name: 'Soft', radius: '0.75rem', radiusLg: '1rem', shadow: 'xs', borderWidth: '0px' },
  { id: 9, name: 'Bold', radius: '0.5rem', radiusLg: '0.75rem', shadow: 'md', borderWidth: '2px' },
  { id: 10, name: 'Airy', radius: '1rem', radiusLg: '1rem', shadow: 'none', borderWidth: '0px' },
];

// ---------- Hex → HSL conversion ----------

/** Convert "#rrggbb" hex to "H S% L%" string (bare, no hsl() wrapper). */
export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return `0 0% ${Math.round(l * 100)}%`;
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Adjust HSL lightness and saturation for dark mode variant. */
function adjustForDark(hsl: string): string {
  const parts = hsl.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!parts || !parts[1] || !parts[2] || !parts[3]) return hsl;
  const h = parseInt(parts[1]);
  const s = Math.min(100, parseInt(parts[2]) + 8);
  const l = Math.min(95, parseInt(parts[3]) + 3);
  return `${h} ${s}% ${l}%`;
}

// ---------- CSS variable generation ----------

export type ClubThemeInput = {
  primary: string;
  secondary: string;
  tertiary: string;
  styleId: number;
};

/** Generate CSS custom property overrides for light mode. */
export function generateThemeVars(theme: ClubThemeInput): Record<string, string> {
  const style = STYLE_CATALOG.find(s => s.id === theme.styleId) ?? STYLE_CATALOG[0]!;
  const primaryHsl = hexToHsl(theme.primary);

  return {
    '--primary': primaryHsl,
    '--accent': primaryHsl,
    '--ring': primaryHsl,
    '--glow-primary': primaryHsl,
    '--radius': style.radius,
  };
}

/** Generate CSS custom property overrides for dark mode. */
export function generateDarkThemeVars(theme: ClubThemeInput): Record<string, string> {
  const style = STYLE_CATALOG.find(s => s.id === theme.styleId) ?? STYLE_CATALOG[0]!;
  const primaryHsl = hexToHsl(theme.primary);
  const darkPrimaryHsl = adjustForDark(primaryHsl);

  return {
    '--primary': darkPrimaryHsl,
    '--accent': darkPrimaryHsl,
    '--ring': darkPrimaryHsl,
    '--glow-primary': darkPrimaryHsl,
    '--radius': style.radius,
  };
}
