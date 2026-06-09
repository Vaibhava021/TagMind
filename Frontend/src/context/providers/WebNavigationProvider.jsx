import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavigationContext } from '../NavigationContext';

// matches screen keys directly to actual browser paths
const SCREEN_TO_PATH = {
  dashboard: '/',
  reminders: '/reminders',
  duplicates: '/duplicates',
  'import-export': '/import-export',
  settings: '/settings',
  login: '/login',
  profiles: '/profiles',
};

// reverse map generation — maps location pathname keys back into string screen tokens
const PATH_TO_SCREEN = Object.fromEntries(
  Object.entries(SCREEN_TO_PATH).map(([screenName, urlPath]) => [urlPath, screenName])
);

export function WebNavigationProvider({ children }) {
  const nav = useNavigate();
  const location = useLocation();

  // read current active screen tracking based on your live URL path string
  const currentScreen = PATH_TO_SCREEN[location.pathname] || 'dashboard';

  const navigate = useCallback((screen) => {
    nav(SCREEN_TO_PATH[screen]);
  }, [nav]);

  const goBack = useCallback(() => {
    nav(-1); // native browser backward history stack step
  }, [nav]);

  const contextValue = useMemo(() => ({
    currentScreen,
    navigate,
    goBack,
    canGoBack: true, // browser environment always preserves native historical tracking
  }), [currentScreen, navigate, goBack]);

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}