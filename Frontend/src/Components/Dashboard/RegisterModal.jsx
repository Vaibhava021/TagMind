import React, { useState } from 'react'
import { loginUser, registerUser } from '../../api/authApi'
import { setAuthTokens } from '../../api/session'

export default function RegisterModal({fetchData,onClose}){

    const [username,setUsername] = useState('')
    const [email,setEmail] = useState('')
    const [password,setPassword] = useState('')
    const [loading,setLoading] = useState(false)
    const [error,setError] = useState('')
    const [isSignIn,setIsSignIn] = useState(false)

    const handleSubmit = async ()=>{
        try{
            setLoading(true)
            setError('')
            if (!isSignIn) {
                await registerUser(username, email, password)
            }

            const session = await loginUser(email, password)
            await setAuthTokens(session.access, session.refresh)
            const refreshed = await fetchData()
            if (!refreshed) {
                throw new Error('Signed in, but the profile list could not be loaded.')
            }
            onClose()
        }
        catch(err){
            setError(
                err.message
            )
        }

        finally{
            setLoading(false)
        }
    }





return(
    <div className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className=" bg-[#1A1A18] border border-[#534B52] rounded-xl w-105 p-6 shadow-2xl animate-scale-up">

            <div className="mb-5">
                <h2 className="text-white text-xl font-semibold tracking-tight">
                    {isSignIn ? 'Sign In' : 'Create Profile'}
                </h2>

                <p className="text-[#8A8D91] text-sm mt-1">
                    {isSignIn
                        ? 'Sign in to your TagMind account'
                        : 'Create a new TagMind profile'}
                </p>
            </div>

            <div className="flex flex-col gap-3">

                {!isSignIn && <input
                    className="w-full h-11 px-3 rounded-lg bg-[#232321] border border-[#534B52] text-white text-sm outline-none focus:border-[#8A8D91] transition-colors"
                    placeholder="Username"
                    value={username}
                    onChange={(e)=>
                        setUsername(
                            e.target.value
                        )
                    }
                />}

                <input
                    className="w-full h-11 px-3 rounded-lg bg-[#232321] border border-[#534B52] text-white text-sm outline-none focus:border-[#8A8D91] transition-colors"
                    placeholder="Email"
                    value={email}
                    onChange={(e)=>
                        setEmail(
                            e.target.value
                        )
                    }
                />

                <input
                    className="w-full h-11 px-3 rounded-lg bg-[#232321] border border-[#534B52] text-white text-sm outline-none focus:border-[#8A8D91] transition-colors"
                    type="password"
                    minLength={isSignIn ? undefined : 8}
                    placeholder="Password"
                    value={password}
                    onChange={(e)=>
                        setPassword(
                            e.target.value
                        )
                    }
                />

                {!isSignIn && (
                    <p className="text-[11px] text-[#8A8D91] px-1">
                        Use a strong password with at least 8 characters.
                    </p>
                )}

                {
                    error &&
                    <div className="text-red-400 text-xs px-2">
                        {error}
                    </div>
                }
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-[#534B52] text-[#B2B2B2] text-sm hover:bg-[#232321] transition-colors cursor-pointer"
                >Cancel
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white text-sm font-medium transition-colors cursor-pointer"
                >{
                        loading
                            ? (isSignIn ? 'Signing in...' : 'Creating...')
                            : (isSignIn ? 'Sign In' : 'Create Profile')
                    }
                </button>
            </div>

            <div className="text-center mt-4 text-xs text-[#8A8D91]">
                {isSignIn ? 'New to TagMind? ' : 'Already have an account? '}
                <button
                    type="button"
                    onClick={() => {
                        setIsSignIn(!isSignIn)
                        setError('')
                    }}
                    className="text-fuchsia-400 hover:text-fuchsia-300 font-medium cursor-pointer"
                >
                    {isSignIn ? 'Create an account.' : 'Sign in.'}
                </button>
            </div>
        </div>
    </div>
)
}
