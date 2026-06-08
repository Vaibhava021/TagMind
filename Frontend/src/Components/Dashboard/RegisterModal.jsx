import React, { useState } from 'react'
import { registerUser } from '../../api/authApi'

export default function RegisterModal({fetchData,onClose}){

    const [username,setUsername] = useState('')
    const [email,setEmail] = useState('')
    const [password,setPassword] = useState('')
    const [loading,setLoading] = useState(false)
    const [error,setError] = useState('')

    const handleRegister = async ()=>{
        try{
            setLoading(true)
            setError('')
            await registerUser(
                username,
                email,
                password
            )
            await fetchData()
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
                    Create Profile
                </h2>

                <p className="text-[#8A8D91] text-sm mt-1">
                    Create a new TagMind profile
                </p>
            </div>

            <div className="flex flex-col gap-3">

                <input
                    className="w-full h-11 px-3 rounded-lg bg-[#232321] border border-[#534B52] text-white text-sm outline-none focus:border-[#8A8D91] transition-colors"
                    placeholder="Username"
                    value={username}
                    onChange={(e)=>
                        setUsername(
                            e.target.value
                        )
                    }
                />

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
                    placeholder="Password"
                    value={password}
                    onChange={(e)=>
                        setPassword(
                            e.target.value
                        )
                    }
                />

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
                    onClick={handleRegister}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white text-sm font-medium transition-colors cursor-pointer"
                >{
                        loading
                            ? 'Creating...'
                            : 'Create Profile'
                    }
                </button>
            </div>
        </div>
    </div>
)
}