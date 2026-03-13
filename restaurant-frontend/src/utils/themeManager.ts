/**
 * Theme Manager - Gestion dynamique des couleurs de marque
 * Applique les couleurs personnalisées via CSS custom properties
 */

interface BrandingColors {
  primary_color: string;
  secondary_color: string;
  logo_url?: string | null;
}

const DEFAULT_BRANDING: BrandingColors = {
  primary_color: '#f97316',
  secondary_color: '#ea580c',
  logo_url: null,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function applyBranding(branding?: BrandingColors | null): void {
  const colors = branding || DEFAULT_BRANDING;
  const root = document.documentElement;

  const primary = colors.primary_color || DEFAULT_BRANDING.primary_color;
  const secondary = colors.secondary_color || DEFAULT_BRANDING.secondary_color;

  // Couleurs principales
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-primary-light', lighten(primary, 0.85));
  root.style.setProperty('--color-primary-lighter', lighten(primary, 0.92));
  root.style.setProperty('--color-primary-dark', darken(primary, 0.15));
  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-secondary-dark', darken(secondary, 0.15));

  // RGB pour les opacités (shadow, ring, etc.)
  const primaryRgb = hexToRgb(primary);
  if (primaryRgb) {
    root.style.setProperty('--color-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
  }
  const secondaryRgb = hexToRgb(secondary);
  if (secondaryRgb) {
    root.style.setProperty('--color-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
  }

  // Logo
  if (colors.logo_url) {
    root.style.setProperty('--brand-logo-url', `url(${colors.logo_url})`);
  } else {
    root.style.removeProperty('--brand-logo-url');
  }
}

export function saveBrandingToStorage(branding: BrandingColors | null): void {
  if (branding) {
    localStorage.setItem('branding', JSON.stringify(branding));
  } else {
    localStorage.removeItem('branding');
  }
}

export function loadBrandingFromStorage(): BrandingColors | null {
  try {
    const stored = localStorage.getItem('branding');
    if (stored) {
      return JSON.parse(stored) as BrandingColors;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function initTheme(): void {
  const branding = loadBrandingFromStorage();
  applyBranding(branding);
}

export function clearBranding(): void {
  localStorage.removeItem('branding');
  applyBranding(DEFAULT_BRANDING);
}

export function getBrandingLogoUrl(): string | null {
  const branding = loadBrandingFromStorage();
  return branding?.logo_url || null;
}

export { DEFAULT_BRANDING };
export type { BrandingColors };
