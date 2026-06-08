import React, { useMemo, useState } from 'react'
import { setVaultPassword, unlockVault } from '../../api/vaultAPI'


const VaultModal = ({ onClose, selectedProfile, accounts, isvaultOpen, setIsvaultOpen }) => {

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const currentProfile = useMemo(() => {
        return accounts.find(acc => acc.id === selectedProfile)
    }, [accounts, selectedProfile])

    const hasVault = currentProfile?.has_vault

    const handleCreateVault = async () => {
        try{
            setError('')
            setLoading(true)

            if(password !== confirmPassword){
                throw new Error('Passwords do not match')
            }
            await setVaultPassword(selectedProfile, password)
            currentProfile.has_vault = true
            chrome.storage.session.set({vaultOpen: true}

            )
            setIsvaultOpen(true)
            onClose()
        }
        catch(err){
            setError(err.message)
        }
        finally{
            setLoading(false)
        }
    }

    const handleUnlockVault = async ()=>{
        try{
            setError('')
            setLoading(true)

            const result = await unlockVault(selectedProfile, password)

            if(!result.success){throw new Error('Wrong password')}

            chrome.storage.session.set({vaultOpen: true})
            setIsvaultOpen(true)
            onClose()
        }

        catch(err){
            setError(err.message)
        }

        finally{
            setLoading(false)
        }
    }

    return(

<div className='fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in'>
    <div className='bg-[#1a1a18] border border-[#534B52] rounded-xl p-6 w-105 animate-scale-up'>
        <h2 className='text-white text-xl font-semibold mb-1'>
            {hasVault
                ? 'Unlock Vault'
                : 'Create Vault'}

        </h2>
        <p className='text-[#8A8D91] text-sm mb-5'>

            {hasVault
                ? 'Enter your vault password'
                : 'Create a vault password'}
        </p>

        <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className='w-full bg-[#262624] border border-[#534B52] rounded-lg px-3 py-2 text-white outline-none mb-3'
        />

        {
            !hasVault &&
            <input
                type='password'
                placeholder='Confirm Password'
                value={confirmPassword}
                onChange={(e)=>setConfirmPassword(e.target.value)}

                className='w-full bg-[#262624] border border-[#534B52] rounded-lg px-3 py-2 text-white outline-none mb-3'
            />
        }

        {
            error &&
            <p className='text-red-500 text-sm mb-3'>
                {error}
            </p>
        }

        <div className='flex justify-end gap-2'>

            <button
                onClick={onClose}
                className='px-4 py-2 rounded-lg border border-[#534B52] text-white cursor-pointer'
                >Cancel
            </button>

            <button
                disabled={loading}
                onClick={hasVault
                            ? handleUnlockVault
                            : handleCreateVault
                        }

                className='px-4 py-2 rounded-lg bg-[#5029FA] text-white cursor-pointer hover:bg-[#6440ff]'>
                {
                    loading
                    ? 'Please wait...'
                    : hasVault
                        ? 'Unlock'
                        : 'Create Vault'
                }

            </button>
        </div>
    </div>
</div>

)
}

export default VaultModal