import React, { useState, useCallback } from 'react';
import { NavigationContext } from '../NavigationContext';

export function ExtNavigationProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  
  // array history tracker so going back works inside the extension popup
  const [history, setHistory] = useState([]);

  const navigate = useCallback((screen) => {
    // push current screen into the history array before transitioning
    setHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
  }, [currentScreen]);

  const goBack = useCallback(() => {
    if (history.length === 0) return;
    
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1)); // remove the last element
    setCurrentScreen(previous);
  }, [history]);

  return (
    <NavigationContext.Provider value={{
      currentScreen,
      navigate,
      goBack,
      canGoBack: history.length > 0,
    }}>
      {children}
    </NavigationContext.Provider>
  );
}