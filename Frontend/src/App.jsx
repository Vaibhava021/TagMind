  import { useEffect, useState, useRef, useCallback } from 'react'
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

    const [accountsStatus, setAccountsStatus] = useState('loading')
    const [accountsError, setAccountsError] = useState(null)

    // const refreshAccounts = async () => {
    //   const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}accounts/profiles/`);
    //   setAccounts(await res.json());
    // };
    const handleBackendReady = useCallback(() => {
      setBackendReady(true);
    }, []);
    const refreshAccounts = async () => {
      setAccountsError(null)

      setAccountsStatus(current =>
        current === 'success' ? 'success' : 'loading'
      )
      const url = `${import.meta.env.VITE_API_BASE_URL}accounts/profiles/`
      let lasterror

      // retry fetching account 3 times if failure occurs 
      for (let attempt = 0; attempt < 3; attempt++) {
        try{
          const res = await fetch(url)

          if(!res.ok){
            throw new Error(`Failed to fetch accounts (HTTP ${res.status})`)
          }
          const data = await res.json()
          const profileList = Array.isArray(data) ? data : data?.result ?? data?.results
          if (!Array.isArray(profileList)) {
            throw new Error('The profiles API returned an unexpected response')
          }

          setAccounts(profileList)
          setAccountsStatus('success')
          setAccountsError(null)

          return true
        } catch(error) {
          lasterror = error
          
          if(attempt < 2){
            await new Promise(resolve => setTimeout(resolve, 500*(attempt+1)))
          }
        }
      }
      setAccountsError(lasterror?.message || 'Unable to load Profiles.')
      setAccountsStatus(current => current === 'success' ? 'success' : 'error')
      return false
    }

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
      if (!backendReady) return;
      refreshAccounts();
      // console.log('App context object:', NavigationContext)
    }, [backendReady])


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
          refreshAccounts={refreshAccounts}
        />
        ),
      login: <Login />,
        'google-login': <GoogleLogin />,
      
      dashboard: selectedProfile ? (
        <Dashboard
          {...profileProps}
          refreshAccounts={refreshAccounts}
          setLogState={setLogState}
          LogState={LogState}
          isvaultOpen={isvaultOpen}
          setIsvaultOpen={setIsvaultOpen}
        />
        ) : (
          <ProfileSelector
          {...profileProps}
          refreshAccounts={refreshAccounts}
          />
        ),
    }

    const resolvedScreen = screens[currentScreen] ? currentScreen : 'profiles'
    if (!backendReady) {
      return <Startup onReady={handleBackendReady} />
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