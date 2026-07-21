import { useEffect, useState, useRef } from 'react'
import { useNavigation } from './context/NavigationContext'
import Dashboard       from './Pages/Dashboard'
import ProfileSelector from './Pages/Profiles'
import Login           from './Pages/Login'
import GoogleLogin     from './Pages/GoogleLogin'
import LoggingOut      from './Pages/LoggingOut'
import { useSessionAuth } from './Hooks/useChromeStorage'
import { NavigationContext } from './context/NavigationContext'
import Startup from './Pages/Startup'

const App = () => {
  const { currentScreen, navigate } = useNavigation()
  const [backendReady, setBackendReady] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const profileRef = useRef(null)                              

  const [accounts, setAccounts]                 = useState([])
  const { isAuthenticated, setIsAuthenticated } = useSessionAuth()
  const [LogState, setLogState]                 = useState(null)
  const [isvaultOpen, setIsvaultOpen]           = useState(false)

  // updates both the ref (sync) and state (async)
  const handleSetSelectedProfile = (id) => {
    profileRef.current = id
    setSelectedProfile(id)
  }

  useEffect(() => {
    chrome.storage.session.get('selectedProfile').then(result => {
      if (result.selectedProfile) {
        handleSetSelectedProfile(result.selectedProfile)
        navigate('dashboard')
      }
    })

    chrome.storage.session.get('vaultOpen').then(result => {
      if (result.vaultOpen) {
        setIsvaultOpen(true)
      }
    })

    // console.log('App context object:', NavigationContext)
  }, [])


  const profileProps = {
    selectedProfile,
    setSelectedProfile: handleSetSelectedProfile,  
    accounts,
    setAccounts,
  }

  const screens = {
    profiles: (
      <ProfileSelector
        {...profileProps}
      />
      ),
    login: <Login />,
      'google-login': <GoogleLogin />,
    
    dashboard: selectedProfile ? (
      <Dashboard
        {...profileProps}
        setLogState={setLogState}
        LogState={LogState}
        isvaultOpen={isvaultOpen}
        setIsvaultOpen={setIsvaultOpen}
      />
      ) : (
        <ProfileSelector
          {...profileProps}
        />
      ),
}

  const resolvedScreen = screens[currentScreen] ? currentScreen : 'profiles'
  if (!backendReady) {
    return <Startup onReady={() => setBackendReady(true)} />
  }
  return (
  <div>
    {screens[resolvedScreen]}
    {LogState === 'logging_out' && (
      <LoggingOut
        setSelectedProfile={handleSetSelectedProfile}
        setLogState={setLogState}
        setIsvaultOpen={setIsvaultOpen}
      />
    )}
  </div>
  )
}

export default App