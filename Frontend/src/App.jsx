import React, { useEffect, useState } from 'react'
import Dashboard from './Pages/Dashboard'
import { DomainProvider } from './context/DomainContext'
import { useContext } from "react";
import AppPassword from './Pages/AppPassword';
import ProfileSelector from './Pages/Profiles';
import Login from './Pages/Login';
import LoggingOut from './Pages/LoggingOut';
import { useSessionAuth } from './Hooks/useChromeStorage';
import GoogleLogin from './Pages/GoogleLogin';

const App = () => {
  const [screen, setscreen] = useState('profiles')
  const [selectedProfile, setSelectedProfile] = useState(null) 
  
  // const [selectedProfile, setSelectedProfile] = useState(1) 
  const [accounts, setAccounts] = useState([])
  const {isAuthenticated, setIsAuthenticated} = useSessionAuth()

  // log state 
  const [LogState, setLogState] = useState(null)

  // Vault mode 
  const [isvaultOpen, setIsvaultOpen] = useState(false)
    
  const screens = {
      profiles: () =>  (<ProfileSelector
                            selectedProfile={selectedProfile}
                            accounts={accounts}
                            setAccounts={setAccounts}
                            setSelectedProfile={setSelectedProfile}
                            setLogState={setLogState}
                      />),
      password: () =>  (<AppPassword /> ),
      dashboard: () => (<Dashboard
                            selectedProfile={selectedProfile}
                            setSelectedProfile={setSelectedProfile}
                            accounts={accounts}
                            setAccounts={setAccounts}
                            setLogState={setLogState}
                            LogState={LogState}
                            isvaultOpen={isvaultOpen}
                            setIsvaultOpen={setIsvaultOpen}
                      />),
      login: () => (<Login />) ,
      logging_out: () => (<LoggingOut 
                            setSelectedProfile={setSelectedProfile}
                            setLogState={setLogState}
                            setIsvaultOpen={setIsvaultOpen}
                          />)

  };

  useEffect(()=> {
    // console.log("App Profile:", selectedProfile)
    chrome.storage.session.get('selectedProfile').then(result => {
      if(result.selectedProfile){
        setSelectedProfile(result.selectedProfile)
      }
    })

    chrome.storage.session.get('vaultOpen').then(result => {
      if(result.vaultOpen){
        setIsvaultOpen(true)
      }
    })
  },[])

  return (
    <div>
      <DomainProvider>
        {(() => {
          if(selectedProfile){
            return (
            <>
            {screens['dashboard']()}
            {LogState==='logging_out' && screens['logging_out']()}
            </>
            )
          } else {
            return screens['profiles']();
          }
        })()}
      </DomainProvider>
    </div> 
  )
}

export default App
