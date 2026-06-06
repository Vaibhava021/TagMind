import React from 'react'
import { useState } from 'react'

export const SearchSyncBar = ({search, setSearch, device, setDevice, isLoading_Device}) => {

    const deviceOptions = [
            { id: 'pc', label: 'PC' },
            { id: 'mobile', label: 'Mobile' },
            { id: 'all', label: 'ALL' }
        ];
  return (

    <div className='h-13 border-b-2 border-[#534B52] flex justify-evenly items-center p-1.5 gap-2'>
        <input 
            type="text"
            className={`border border-gray-500 rounded-lg py-1 px-3 w-78 h-8
                        outline-none focus:outline-none
                         ${search ? "text-white font-normal text-[17px]" : "text-gray-300 font-light text-[15px]"}`} 
            placeholder="Search..." 
            id=""
            onChange={(e)=> setSearch(e.target.value)}
            value={search}
             />


        <div className='text-white flex gap-0.75'>
            {deviceOptions.map((opt)=> {
                const isActive = device === opt.id 
                return (
                    <button key = {opt.id}
                            onClick={()=> setDevice(opt.id)}
                            disabled={isLoading_Device}
                            className={`border-gray-500 cursor-pointer border-2 px-3 rounded-lg h-8 flex items-center justify-center
                                        hover:scale-104 active:scale-97 transition-all duration-50 ease-in-out
                                        ${isActive && !isLoading_Device ? "bg-[#db00b6] border-none font-extrabold":"bg-transparent font-light"}
                                        ${isLoading_Device ? "opacity-40 bg-transparent pointer-events-none grayscale-25":"opacity-100"}
                                        }`}>

                            <span className='translate-y-px'>{opt.label}</span>
                    </button>
                )
            })}
        </div>


        <div className='text-white cursor-pointer font-semibold hover:scale-104 active:scale-97 transition-all duration-50 ease-in-out'>
            <button className='border-gray-500 cursor-pointer border px-3 rounded-lg h-8 flex items-center gap-2'>
                <i className='ri-loop-right-line font-extralight text-sm'></i>
                <span className='translate-y-px'>Sync</span>
            </button>
        </div>
    </div>
  )
}
