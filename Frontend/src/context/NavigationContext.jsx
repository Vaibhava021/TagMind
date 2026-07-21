import { createContext, useContext } from 'react'

// all valid screen names - will add all the new screens 
export const NavigationContext = createContext({
  currentScreen: 'profiles',
  navigate: () => {},
  goBack: () => {},
  canGoBack: false,
})

export const useNavigation = () => useContext(NavigationContext)