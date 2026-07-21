import { useState, useCallback, useEffect } from 'react'
import { NavigationContext } from '../NavigationContext'

export function ExtNavigationProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('profiles')
  const [navigationState, setNavigationState] = useState({})
  const [history, setHistory] = useState([])

  // useCallback with empty deps — navigate never becomes stale
  const navigate = useCallback((screen, state = {}) => {  
    setCurrentScreen(prev => {
        setHistory(h => [...h, prev])
        return screen
    })
    setNavigationState(state)
  }, [])

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev
      const previous = prev[prev.length - 1]
      setCurrentScreen(previous)
      return prev.slice(0, -1)
    })
  }, [])  // ← empty array
  useEffect(() => {
  // console.log('ExtProvider context object:', NavigationContext)
  }, [])

  return (
    <NavigationContext.Provider value={{
      currentScreen,
      navigationState,
      navigate,
      goBack,
      canGoBack: history.length > 0,
    }}>
      {children}
    </NavigationContext.Provider>
  )
}