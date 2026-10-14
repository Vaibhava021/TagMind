
import React, { useState } from 'react'
import RegisterModal from '../Components/Dashboard/RegisterModal'
import { getGoogleToken } from '../api/googleExtensionAuth'
import { googleLogin } from '../api/googleAuth'
import { useNavigation } from '../context/NavigationContext'

const ProfileSelector = ({
  selectedProfile,
  setSelectedProfile,
  accounts,
  refreshAccounts,
}) => {
  const { navigate } = useNavigation()

  const [selectedId, setSelectedId] = useState('')
  const [showRegister, setShowRegister] = useState(false)

  // Refresh accounts through App.jsx.
  // refreshAccounts updates the shared accounts state itself.
  const fetchData = async () => {
    return await refreshAccounts()
  }

  const handleGoogleLogin = async () => {
    try {
      const token = await getGoogleToken()
      const result = await googleLogin(token)

      console.log('Backend Response:', result)

      const refreshed = await fetchData()

      if (!refreshed) {
        console.error('Google login succeeded, but profiles could not be refreshed.')
      }
    } catch (err) {
      console.error(err)
      alert(err.message || 'Google Login Failed')
    }
  }

  const getInitials = (username) => {
    if (!username) return '?'

    return username
      .trim()
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const darkenColor = (hex, amount = 0.25) => {
    if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
      return '#222222'
    }

    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    const darkR = Math.floor(r * amount)
    const darkG = Math.floor(g * amount)
    const darkB = Math.floor(b * amount)

    return `rgb(${darkR}, ${darkG}, ${darkB})`
  }

  // Defensive rendering: never call map on a non-array.
  const profileList = Array.isArray(accounts) ? accounts : []

  return (
    <>
      <div className="bg-[#1a1a18] h-150 w-145 flex flex-col overflow-hidden font-sans mx-auto">
        <div className="w-full text-white flex flex-col items-center p-6 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg flex items-center justify-center">
              <img src="icons/icon-32.png" alt="TagMind Icon" />
            </div>
            <span className="font-semibold text-[15px]">TagMind</span>
          </div>

          <h1 className="text-xl font-semibold pb-1.5">
            Choose a profile
          </h1>

          <h2 className="text-[13px] font-normal text-[#717275]">
            Select an account to continue
          </h2>
        </div>

        <div className="flex-1 w-full px-6 overflow-y-auto flex flex-col gap-3 pb-2 hover-scrollbar">
          {profileList.map((acc) => {
            const isActive = String(selectedId) === String(acc.id)

            return (
              <div
                key={acc.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedId(acc.id)
                }}
                onDoubleClick={async (e) => {
                  e.stopPropagation()

                  try {
                    await chrome.storage.session.set({
                      selectedProfile: acc.id,
                    })

                    setSelectedProfile(acc.id)
                    console.log('Selected profile:', acc.id)
                    navigate('dashboard')
                  } catch (err) {
                    console.error('Failed to save selected profile:', err)
                  }
                }}
                className={`flex items-center p-3.5 rounded-xl cursor-pointer transition-all ease-in-out duration-120 ${
                  isActive
                    ? 'bg-[#222222]'
                    : 'bg-[#1e1e1c] border-transparent hover:bg-[#262626]'
                }`}
                style={{
                  border: isActive
                    ? `1px solid ${acc.accent_color || '#0496ff'}`
                    : '1px solid transparent',
                }}
              >
                <div
                  className={`h-11 w-11 rounded-full flex items-center justify-center text-lg font-medium shrink-0 select-none ${acc.avatarBg || ''} ${acc.avatarText || ''}`}
                  style={{
                    color: acc.accent_color || '#0496ff',
                    backgroundColor: darkenColor(acc.accent_color),
                  }}
                >
                  {getInitials(acc.username)}
                </div>

                <div className="ml-3.5 flex-1 overflow-hidden">
                  <div className="text-[15px] text-gray-100 font-medium truncate">
                    {acc.username}
                  </div>

                  <div className="text-[13px] text-[#717275] truncate mt-0.5">
                    {acc.email}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#151515] border border-zinc-800/80 shrink-0 mr-3">
                  {acc.provider === 'google' ? (
                    <i className="ri-google-fill text-[#34a853] text-[12px]" />
                  ) : (
                    <i className="ri-mail-line text-[#818cf8] text-[12px]" />
                  )}

                  <span className="text-[11px] font-medium text-gray-300">
                    {acc.provider === 'google' ? 'Google' : 'Email'}
                  </span>
                </div>

                <i
                  className={`ri-arrow-right-s-line text-xl ${
                    isActive ? 'text-[#a855f7]' : 'text-[#717275]'
                  }`}
                />
              </div>
            )
          })}
        </div>

        <div className="w-full px-6 pb-4 pt-2 flex flex-col">
          <div className="flex items-center w-full gap-3 mb-2.5">
            <div className="flex-1 border-t border-zinc-800" />

            <span className="text-[12px] text-[#717275] whitespace-nowrap">
              add another account
            </span>

            <div className="flex-1 border-t border-zinc-800" />
          </div>

          <button
            className="flex items-center justify-center gap-2.5 w-full py-1.5 mb-2 rounded-lg border border-zinc-700 bg-transparent hover:bg-zinc-800/50 text-white text-[12px] font-medium transition-colors cursor-pointer"
            onClick={handleGoogleLogin}
          >
            <i className="ri-google-fill text-lg" />
            Continue with Google
          </button>

          <button
            className="flex items-center justify-center gap-2.5 w-full py-1.5 rounded-lg border border-zinc-700 bg-transparent hover:bg-zinc-800/50 text-white text-[12px] font-medium transition-colors cursor-pointer"
            onClick={() => setShowRegister(true)}
          >
            <i className="ri-mail-line text-lg" />
            Sign in with email
          </button>
        </div>
      </div>

      {showRegister && (
        <RegisterModal
          fetchData={fetchData}
          onClose={() => setShowRegister(false)}
        />
      )}
    </>
  )
}

export default ProfileSelector
