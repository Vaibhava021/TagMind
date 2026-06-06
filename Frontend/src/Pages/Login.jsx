import React from 'react'

const Login = ({ setIsAuthenticated }) => {
    return <div className='bg-[#262624] h-150 w-145 text-white'>

            <h2>Login</h2>

            <button
                className='cursor-pointer'
                onClick={()=>{
                    setIsAuthenticated(true)
                }}
            >
                Enter App
            </button>

        </div>
  
}

export default Login