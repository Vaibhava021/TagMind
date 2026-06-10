import { useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { NavigationContext } from '../NavigationContext'

const SCREEN_TO_PATH = {
  profiles:       '/profiles',
  login:          '/login',
  'google-login': '/google-login',
  dashboard:      '/',
  logging_out:    '/logging-out',
}

const PATH_TO_SCREEN = Object.fromEntries(
  Object.entries(SCREEN_TO_PATH).map(([screen, path]) => [path, screen])
)

export function WebNavigationProvider({ children }) {
  const nav = useNavigate()
  const location = useLocation()

  const currentScreen = PATH_TO_SCREEN[location.pathname] || 'profiles'

  const navigate = useCallback((screen) => {
    nav(SCREEN_TO_PATH[screen])
  }, [nav])

  const goBack = useCallback(() => {
    nav(-1)
  }, [nav])

  const value = useMemo(() => ({
    currentScreen,
    navigate,
    goBack,
    canGoBack: true,
  }), [currentScreen, navigate, goBack])

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}