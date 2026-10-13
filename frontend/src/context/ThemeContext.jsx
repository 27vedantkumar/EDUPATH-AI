import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEME_DEFINITIONS = {
  'day-peach': {
    id: 'day-peach',
    pageNumber: 1,
    name: 'Warm Peach (Day 1)',
    type: 'day',
    label: 'Peach Day',
    icon: '🍑',
    bgCanvas: '#fbf5ee',
    bgCard: '#ffffff',
    bgInnerCard: '#feece5',
    borderCard: '#f3e8dc',
    bannerBg: '#fed8cd',
    bannerBorder: '#fbc8b7',
    coursePillBg: '#fef08a',
    ingestBtnBg: '#fed8cd',
    remediationBtnBg: '#fed8cd',
    socraticBtnBg: '#fef08a',
    askTutorBtnBg: '#18181b',
    askTutorBtnText: '#ffffff',
    diagnosticBtnBg: '#fee2d5',
    diagnosticBtnBorder: '#fbc8b7',
    textMain: '#1e293b',
    textMuted: '#64748b',
    badgeMastery: '#10b981',
    activeTabBg: '#feece5',
    activeTabText: '#c2410c'
  },
  'day-rose': {
    id: 'day-rose',
    pageNumber: 2,
    name: 'Soft Rose (Day 2)',
    type: 'day',
    label: 'Rose Day',
    icon: '🌸',
    bgCanvas: '#fcf2f4',
    bgCard: '#ffffff',
    bgInnerCard: '#fef2f4',
    borderCard: '#fce7eb',
    bannerBg: '#fce3e8',
    bannerBorder: '#f9bfcb',
    coursePillBg: '#fce7f3',
    ingestBtnBg: '#fdd9e0',
    remediationBtnBg: '#fdd9e0',
    socraticBtnBg: '#f3e8ff',
    askTutorBtnBg: '#18181b',
    askTutorBtnText: '#ffffff',
    diagnosticBtnBg: '#fff0f3',
    diagnosticBtnBorder: '#f9bfcb',
    textMain: '#1e293b',
    textMuted: '#64748b',
    badgeMastery: '#10b981',
    activeTabBg: '#fce7f3',
    activeTabText: '#be185d'
  },
  'night-indigo': {
    id: 'night-indigo',
    pageNumber: 3,
    name: 'Midnight Indigo (Night 1)',
    type: 'night',
    label: 'Indigo Night',
    icon: '🌌',
    bgCanvas: '#0c0e1d',
    bgCard: '#161932',
    bgInnerCard: '#1a1e3d',
    borderCard: '#24284d',
    bannerBg: '#21274a',
    bannerBorder: '#3b4280',
    coursePillBg: '#6ee7b7',
    ingestBtnBg: '#818cf8',
    remediationBtnBg: '#818cf8',
    socraticBtnBg: '#6ee7b7',
    askTutorBtnBg: '#121524',
    askTutorBtnText: '#ffffff',
    diagnosticBtnBg: '#23284a',
    diagnosticBtnBorder: '#3b4280',
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    badgeMastery: '#34d399',
    activeTabBg: '#22274c',
    activeTabText: '#a5b4fc'
  },
  'night-emerald': {
    id: 'night-emerald',
    pageNumber: 4,
    name: 'Cyber Emerald (Night 2)',
    type: 'night',
    label: 'Emerald Night',
    icon: '🌿',
    bgCanvas: '#071312',
    bgCard: '#10211f',
    bgInnerCard: '#142a27',
    borderCard: '#1c3835',
    bannerBg: '#173330',
    bannerBorder: '#28544f',
    coursePillBg: '#fef08a',
    ingestBtnBg: '#5eead4',
    remediationBtnBg: '#5eead4',
    socraticBtnBg: '#fef08a',
    askTutorBtnBg: '#07100f',
    askTutorBtnText: '#ffffff',
    diagnosticBtnBg: '#18302d',
    diagnosticBtnBorder: '#28544f',
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    badgeMastery: '#34d399',
    activeTabBg: '#193834',
    activeTabText: '#6ee7b7'
  }
};

const ThemeContext = createContext(null);
const STORAGE_KEY_THEME_ID = 'edupath_theme_id_v2';

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME_ID);
      if (saved && THEME_DEFINITIONS[saved]) {
        return saved;
      }
      // Check legacy setting
      const legacy = localStorage.getItem('edupath_theme_v1');
      if (legacy === 'light') return 'day-peach';
      if (legacy === 'dark') return 'night-indigo';
    } catch (_) {}
    return 'day-peach'; // Default to Page 1 of reference PDF
  });

  const themeConfig = THEME_DEFINITIONS[theme] || THEME_DEFINITIONS['day-peach'];
  const isNight = themeConfig.type === 'night';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (isNight) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Apply CSS custom properties dynamically
    root.style.setProperty('--theme-bg-canvas', themeConfig.bgCanvas);
    root.style.setProperty('--theme-bg-card', themeConfig.bgCard);
    root.style.setProperty('--theme-bg-inner-card', themeConfig.bgInnerCard);
    root.style.setProperty('--theme-border-card', themeConfig.borderCard);
    root.style.setProperty('--theme-banner-bg', themeConfig.bannerBg);
    root.style.setProperty('--theme-banner-border', themeConfig.bannerBorder);
    root.style.setProperty('--theme-course-pill', themeConfig.coursePillBg);
    root.style.setProperty('--theme-ingest-btn', themeConfig.ingestBtnBg);
    root.style.setProperty('--theme-remediation-btn', themeConfig.remediationBtnBg);
    root.style.setProperty('--theme-socratic-btn', themeConfig.socraticBtnBg);

    try {
      localStorage.setItem(STORAGE_KEY_THEME_ID, theme);
    } catch (_) {}
  }, [theme, isNight, themeConfig]);

  const toggleDayNight = () => {
    setThemeState((prev) => {
      if (prev === 'day-peach') return 'night-indigo';
      if (prev === 'day-rose') return 'night-emerald';
      if (prev === 'night-indigo') return 'day-peach';
      if (prev === 'night-emerald') return 'day-rose';
      return isNight ? 'day-peach' : 'night-indigo';
    });
  };

  const setTheme = (newThemeId) => {
    if (THEME_DEFINITIONS[newThemeId]) {
      setThemeState(newThemeId);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeConfig,
        isNight,
        isDark: isNight,
        toggleDayNight,
        toggleTheme: toggleDayNight,
        setTheme,
        themes: THEME_DEFINITIONS
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
