import React, { useEffect, useState } from 'react';
import RegisterModal from '../Components/Dashboard/RegisterModal'
import { getGoogleToken } from '../api/googleExtensionAuth';
import { googleLogin } from '../api/googleAuth';
import { useNavigation } from '../context/NavigationContext';


const ProfileSelector = ({selectedProfile, setSelectedProfile, accounts, setAccounts, refreshAccounts}) => {
  // State to track which account is currently selected
  const {navigate} = useNavigation();
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true)
  // const [authMode,setAuthMode] = useState('login')
  const [showRegister,setShowRegister] = useState(false)

  const handleGoogleLogin = async ()=>{
    try{
        const token = await getGoogleToken()
        console.log('Google Token:',token)
        const result = await googleLogin(token)
        console.log('Backend Response:',result)
        await fetchData()
    }

    catch(err){
        console.error(err)
        alert(err.message ||'Google Login Failed')
    }
}

  async function fetchData() {
      try {
        // const accountRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}accounts/profiles/`);
        const accountRes = refreshAccounts;

        const accountsData = await accountRes.json()

        setAccounts(accountsData)
        console.log(accountsData)
      }
      catch(err){
        console.error(err)
      }
      finally{
        setLoading(false)
      }
    }

    useEffect(() => {
      
      fetchData();
    }, []);


    // helper functions 
    const getInitials = (username) => {

    if (!username) return '?';

    return username
        .trim()
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0,2)
        .toUpperCase();
}


const darkenColor = (hex,amount = 0.25) => {
    if(!hex) return '#222222'
    const r = parseInt(hex.slice(1,3),16)
    const g = parseInt(hex.slice(3,5),16)
    const b = parseInt(hex.slice(5,7),16)
    const darkR = Math.floor(r * amount)
    const darkG = Math.floor(g * amount)
    const darkB = Math.floor(b * amount)
    return `rgb(${darkR}, ${darkG}, ${darkB})`
}
  return (
    <>
    <div className='bg-[#1a1a18] h-150 w-145  flex flex-col overflow-hidden font-sans mx-auto'>
      <div className='w-full text-white flex flex-col items-center p-6 pt-6'>
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-[#a855f7] p-1.5 rounded-lg flex items-center justify-center">
            <i className="ri-bookmark-fill text-white text-sm"></i>
          </div>
          <span className="font-semibold text-[15px]">TagMind</span>
        </div>
        <h1 className='text-xl font-semibold pb-1.5'>Choose a profile</h1>
        <h2 className='text-[13px] font-normal text-[#717275]'>Select an account to continue</h2>
      </div>

      <div className='flex-1 w-full px-6 overflow-y-auto flex flex-col gap-3 pb-2 hover-scrollbar'>
        {accounts?.map((acc) => {
          const isActive = String(selectedId) === String(acc.id);
          
          return (
            <div
              key={acc.id}
              onClick={(e) => {
                e.stopPropagation();

                setSelectedId(acc.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                chrome.storage.session.set({ selectedProfile: acc.id })
                setSelectedProfile(acc.id)
                console.log('double click fired, acc.id:', acc.id)
                // small timeout lets React flush the state before navigation evaluates
                setTimeout(() => navigate('dashboard'), 0)
              }}
              className={`flex items-center p-3.5 rounded-xl cursor-pointer transition-all ease-in-out duration-120 ${
                isActive
                  ? `bg-[#222222]`
                  : 'bg-[#1e1e1c] border-transparent hover:bg-[#262626]'
              }`}
              style={{border: isActive? '1px solid ' + acc.accent_color : '1px solid transparent'}}
            >
              <div className={`h-11 w-11 rounded-full flex items-center justify-center text-lg font-medium shrink-0 select-none ${acc.avatarBg} ${acc.avatarText}`}
                   style={{
                        color:
                            acc.accent_color,

                        backgroundColor:
                            darkenColor(
                                acc.accent_color
                            )

                    }}>
                {getInitials(acc.username)}
              </div>
              
              <div className="ml-3.5 flex-1 overflow-hidden">
                <div className="text-[15px] text-gray-100 font-medium truncate">{acc.username}</div>
                <div className="text-[13px] text-[#717275] truncate mt-0.5">{acc.email}</div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#151515] border border-zinc-800/80 shrink-0 mr-3">
                {acc.provider === 'google' ? (
                  <i className="ri-google-fill text-[#34a853] text-[12px]"></i>
                ) : (
                  <i className="ri-mail-line text-[#818cf8] text-[12px]"></i>
                )}
                <span className="text-[11px] font-medium text-gray-300">
                  {acc.provider === 'google' ? 'Google' : 'Email'}
                </span>
              </div>
              
              <i className={`ri-arrow-right-s-line text-xl ${isActive ? 'text-[#a855f7]' : 'text-[#717275]'}`}></i>
            </div>
          );
        })}
      </div>

      <div className='w-full px-6 pb-4 pt-2 flex flex-col'>
        
        <div className="flex items-center w-full gap-3 mb-2.5">
          <div className="flex-1 border-t border-zinc-800"></div>
          <span className="text-[12px] text-[#717275] whitespace-nowrap">
            add another account
          </span>
          <div className="flex-1 border-t border-zinc-800"></div>
        </div>

        <button className="flex items-center justify-center gap-2.5 w-full py-1.5 mb-2 rounded-lg border border-zinc-700 bg-transparent hover:bg-zinc-800/50 text-white text-[12px] font-medium transition-colors cursor-pointer"
                  onClick={()=>{
                    console.log("Continue with Google CLICKED")
                    // handleGoogleLogin()
                  }}>
          <i className="ri-google-fill text-lg"></i> Continue with Google
        </button>
        <button className="flex items-center justify-center gap-2.5 w-full py-1.5 rounded-lg border border-zinc-700 bg-transparent hover:bg-zinc-800/50 text-white text-[12px] font-medium transition-colors cursor-pointer"
                onClick={()=>{
                  console.log("Sign in with email clicked")
                  setShowRegister(true)}}>
          <i className="ri-mail-line text-lg"></i> Sign in with email
        </button>

      </div>
    </div>
    {
        showRegister && (
            <RegisterModal
                fetchData={fetchData}
                onClose={() =>
                    setShowRegister(false)
                }
            />
        )
    }
    </>
  );
};

export default ProfileSelector;