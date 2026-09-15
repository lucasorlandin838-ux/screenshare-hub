import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeId, AccentColor } from '../types';

export interface ThemeStyles {
  id: ThemeId;
  name: string;
  bgMain: string;
  bgSidebar: string;
  bgHeader: string;
  bgCard: string;
  bgInput: string;
  borderColor: string;
  textPrimary: string;
  textMuted: string;
}

export const THEMES: Record<ThemeId, ThemeStyles> = {
  discord: {
    id: 'discord',
    name: 'Discord Escuro',
    bgMain: '#313338',
    bgSidebar: '#2b2d31',
    bgHeader: '#1e1f22',
    bgCard: '#232428',
    bgInput: '#383a40',
    borderColor: '#3f4147',
    textPrimary: '#f2f3f5',
    textMuted: '#949ba4',
  },
  oled: {
    id: 'oled',
    name: 'OLED Preto Puro',
    bgMain: '#000000',
    bgSidebar: '#09090b',
    bgHeader: '#050505',
    bgCard: '#121214',
    bgInput: '#18181b',
    borderColor: '#27272a',
    textPrimary: '#fafafa',
    textMuted: '#a1a1aa',
  },
  midnight: {
    id: 'midnight',
    name: 'Roxo Meia-Noite',
    bgMain: '#0d0b1a',
    bgSidebar: '#130f26',
    bgHeader: '#090714',
    bgCard: '#1a1538',
    bgInput: '#231d4d',
    borderColor: '#2d2460',
    textPrimary: '#f5f3ff',
    textMuted: '#a78bfa',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    bgMain: '#080c14',
    bgSidebar: '#0c1322',
    bgHeader: '#05080e',
    bgCard: '#111b30',
    bgInput: '#182744',
    borderColor: '#1e3a5f',
    textPrimary: '#f0f9ff',
    textMuted: '#38bdf8',
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix Verde',
    bgMain: '#050c07',
    bgSidebar: '#09140c',
    bgHeader: '#030704',
    bgCard: '#0e1f13',
    bgInput: '#142e1b',
    borderColor: '#1c4226',
    textPrimary: '#ecfdf5',
    textMuted: '#34d399',
  },
};

export interface AccentStyles {
  id: AccentColor;
  name: string;
  hex: string;
  hoverHex: string;
  glowClass: string;
  badgeBg: string;
}

export const ACCENTS: Record<AccentColor, AccentStyles> = {
  blurple: {
    id: 'blurple',
    name: 'Discord Blurple',
    hex: '#5865F2',
    hoverHex: '#4752c4',
    glowClass: 'shadow-[0_0_15px_rgba(88,101,242,0.4)]',
    badgeBg: 'bg-[#5865F2]',
  },
  emerald: {
    id: 'emerald',
    name: 'Verde Esmeralda',
    hex: '#10b981',
    hoverHex: '#059669',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    badgeBg: 'bg-emerald-500',
  },
  cyan: {
    id: 'cyan',
    name: 'Ciano Neon',
    hex: '#06b6d4',
    hoverHex: '#0891b2',
    glowClass: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    badgeBg: 'bg-cyan-500',
  },
  rose: {
    id: 'rose',
    name: 'Rosa Carmim',
    hex: '#f43f5e',
    hoverHex: '#e11d48',
    glowClass: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]',
    badgeBg: 'bg-rose-500',
  },
  amber: {
    id: 'amber',
    name: 'Âmbar Dourado',
    hex: '#f59e0b',
    hoverHex: '#d97706',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    badgeBg: 'bg-amber-500',
  },
};

interface ThemeContextType {
  themeId: ThemeId;
  accentId: AccentColor;
  theme: ThemeStyles;
  accent: AccentStyles;
  setThemeId: (t: ThemeId) => void;
  setAccentId: (a: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('hub_theme') as ThemeId;
    return saved && THEMES[saved] ? saved : 'discord';
  });

  const [accentId, setAccentState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('hub_accent') as AccentColor;
    return saved && ACCENTS[saved] ? saved : 'blurple';
  });

  const setThemeId = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem('hub_theme', t);
  };

  const setAccentId = (a: AccentColor) => {
    setAccentState(a);
    localStorage.setItem('hub_accent', a);
  };

  const theme = THEMES[themeId];
  const accent = ACCENTS[accentId];

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-main', theme.bgMain);
    document.documentElement.style.setProperty('--bg-sidebar', theme.bgSidebar);
    document.documentElement.style.setProperty('--accent-color', accent.hex);
  }, [theme, accent]);

  return (
    <ThemeContext.Provider value={{ themeId, accentId, theme, accent, setThemeId, setAccentId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
