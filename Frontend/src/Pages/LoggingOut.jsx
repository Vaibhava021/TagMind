import React from 'react'
import { useNavigation } from '../context/NavigationContext';

const LoggingOut = ({setSelectedProfile, setLogState, setIsvaultOpen}) => {
  const { navigate } = useNavigation();

  return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-xs select-none animate-fade-in">
        <div className="bg-[#262624] border border-[#534B52] p-5 rounded-xl w-65 text-center shadow-2xl text-white animate-scale-up">
          <i className="ri-logout-box-line text-[#ff292e] text-2xl block mb-1"></i>
          <h3 className="text-xs font-bold mb-1">Confirm Logout</h3>
          <p className="text-[11px] text-[#b2b2b2] mb-4 leading-normal">
            Are you sure you want to log out of this profile?
          </p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => setLogState(null)} 
              className="bg-[#333533] border border-[#6b6d6f] text-[#b2b2b2] text-[10.5px] font-bold px-3 py-1.5 rounded-md hover:bg-[#404040] cursor-pointer"
            >Cancel
            </button>
            <button 
              onClick={async () => {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
                  await chrome.storage.session.remove(['selectedProfile','vaultOpen']);
                  setIsvaultOpen(false);
                }
                setSelectedProfile(null);
                setLogState("logged_out");
                navigate('profiles')
              }}
              className="bg-[#ff292e] text-white text-[10.5px] font-bold px-3 py-1.5 rounded-md hover:bg-[#c10505] cursor-pointer"
                >Logout
            </button>
          </div>
        </div>
      </div>
  )
}

export default LoggingOut