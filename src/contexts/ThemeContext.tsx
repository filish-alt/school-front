import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface TenantBranding {
  schoolName: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor?: string; // HSL formatted string e.g. "220 75% 45%" or HEX "#114cb8"
  themePreset?: string;
}

export const COLOR_PRESETS: Record<string, { label: string; hsl: string; hex: string; desc: string }> = {
  default: { label: 'Sage Emerald (Default)', hsl: '180 20% 29%', hex: '#3b5a5a', desc: 'Classic academic forest sage' },
  navy: { label: 'Oxford Navy', hsl: '221 83% 40%', hex: '#114cb8', desc: 'Prestigious deep oxford blue' },
  emerald: { label: 'Royal Emerald', hsl: '158 64% 32%', hex: '#1d875a', desc: 'Vibrant prestigious green' },
  purple: { label: 'Imperial Purple', hsl: '262 70% 48%', hex: '#772be2', desc: 'Distinguished royal purple' },
  crimson: { label: 'Harvard Crimson', hsl: '348 83% 42%', hex: '#c41237', desc: 'Traditional collegiate crimson' },
  amber: { label: 'Golden Bronze', hsl: '32 90% 45%', hex: '#d97706', desc: 'Warm prestigious gold' },
  cyan: { label: 'Pacific Azure', hsl: '199 89% 40%', hex: '#0ea5e9', desc: 'Modern bright high-tech blue' },
  slate: { label: 'Corporate Slate', hsl: '215 25% 27%', hex: '#334155', desc: 'Modern minimalist dark slate' },
};

function hexToHsl(hex: string): string | null {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length !== 6) return null;
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function formatColorToHsl(color: string): string {
  if (!color) return '';
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    const converted = hexToHsl(trimmed);
    if (converted) return converted;
  }
  let clean = trimmed.replace(/^hsl\s*\(/i, '').replace(/\)$/, '').trim();
  clean = clean.replace(/,/g, ' ').replace(/\s+/g, ' ');
  return clean;
}

interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
  branding: TenantBranding;
  updateBranding: (newBranding: Partial<TenantBranding>) => Promise<void>;
  applyBrandColors: (colorHslOrHex: string) => void;
  resetToDefaultTheme: () => void;
  reloadBranding: () => Promise<void>;
}

export const DEFAULT_BRANDING: TenantBranding = {
  schoolName: 'ExamPrep Academy',
  tagline: 'Excellence in Academic Assessment',
  logoUrl: '',
  primaryColor: '180 20% 29%',
  themePreset: 'default',
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggle: () => {},
  branding: DEFAULT_BRANDING,
  updateBranding: async () => {},
  applyBrandColors: () => {},
  resetToDefaultTheme: () => {},
  reloadBranding: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const [branding, setBranding] = useState<TenantBranding>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tenant_branding');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_BRANDING, ...parsed };
        } catch (e) {}
      }
    }
    return DEFAULT_BRANDING;
  });

  const applyBrandColors = useCallback((colorHslOrHex: string) => {
    if (!colorHslOrHex) return;
    const hsl = formatColorToHsl(colorHslOrHex);
    if (!hsl) return;
    const root = document.documentElement;
    root.style.setProperty('--primary', hsl);
    root.style.setProperty('--ring', hsl);
    root.style.setProperty('--sidebar-primary', hsl);
    root.style.setProperty('--chart-1', hsl);
  }, []);

  const resetToDefaultTheme = useCallback(() => {
    const root = document.documentElement;
    root.style.removeProperty('--primary');
    root.style.removeProperty('--ring');
    root.style.removeProperty('--sidebar-primary');
    root.style.removeProperty('--chart-1');
    setBranding(DEFAULT_BRANDING);
    localStorage.removeItem('tenant_branding');
  }, []);

  // Fetch active branding from server and sync
  const reloadBranding = useCallback(async () => {
    try {
      const list = await api.getSystemSettings();
      if (Array.isArray(list)) {
        const item = list.find((s: any) => s.setting_key === 'tenant_branding');
        if (item?.setting_value) {
          const parsed = JSON.parse(item.setting_value);
          const merged = { ...DEFAULT_BRANDING, ...parsed };
          setBranding(merged);
          localStorage.setItem('tenant_branding', JSON.stringify(merged));
          if (merged.primaryColor) {
            applyBrandColors(merged.primaryColor);
          }
        }
      }
    } catch (e) {
      // If server fetch failed, ensure cached branding is still applied
      const saved = localStorage.getItem('tenant_branding');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.primaryColor) {
            applyBrandColors(parsed.primaryColor);
          }
        } catch (err) {}
      }
    }
  }, [applyBrandColors]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Apply current branding color immediately on mount & when branding state changes
  useEffect(() => {
    if (branding.primaryColor) {
      applyBrandColors(branding.primaryColor);
    }
  }, [branding.primaryColor, applyBrandColors]);

  // Initial load and listen for auth events
  useEffect(() => {
    reloadBranding();

    const handleAuthChange = () => {
      reloadBranding();
    };

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [reloadBranding]);

  const updateBranding = async (newBranding: Partial<TenantBranding>) => {
    const merged = { ...branding, ...newBranding };
    if (merged.primaryColor) {
      merged.primaryColor = formatColorToHsl(merged.primaryColor);
    }
    setBranding(merged);
    localStorage.setItem('tenant_branding', JSON.stringify(merged));
    if (merged.primaryColor) {
      applyBrandColors(merged.primaryColor);
    }
    try {
      await api.saveSystemSetting({
        key: 'tenant_branding',
        value: JSON.stringify(merged),
      });
      // Dispatch event so all tabs/components update
      window.dispatchEvent(new Event('auth-change'));
    } catch (e) {
      console.error('Failed to persist branding to server', e);
    }
  };

  return (
    <ThemeContext.Provider value={{
      isDark,
      toggle: () => setIsDark(p => !p),
      branding,
      updateBranding,
      applyBrandColors,
      resetToDefaultTheme,
      reloadBranding,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

