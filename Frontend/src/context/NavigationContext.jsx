// // src/context/NavigationContext.tsx

// import { createContext, useContext } from 'react'

// // every screen name in your app lives here
// // add new screens here as you build them
// export type Screen =
//   | 'dashboard'
//   | 'reminders'
//   | 'duplicates'
//   | 'import-export'
//   | 'settings'
//   | 'login'
//   | 'profiles'

// export const NavigationContextType = {
//   currentScreen: Screen,
//   navigate: (screen: Screen) => void,
//   goBack: () => void,           // web uses browser back, ext uses history stack
//   canGoBack: boolean
// }

// // safe default — prevents crashes if used outside a provider
// export const NavigationContext = createContext<NavigationContextType>({
//   currentScreen: 'dashboard',
//   navigate: () => {},
//   goBack: () => {},
//   canGoBack: false,
// })

// // clean hook — components import this, never the context directly
// export const useNavigation = () => useContext(NavigationContext)


import { createContext, useContext } from 'react'

// all valid screen names — add here as you build new pages
export const NavigationContext = createContext({
  currentScreen: 'profiles',
  navigate: () => {},
  goBack: () => {},
  canGoBack: false,
})

export const useNavigation = () => useContext(NavigationContext)