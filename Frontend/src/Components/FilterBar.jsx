import React, { useEffect, useState } from 'react'
import FocusButton from './FocusButton'

const FilterBar = ({className, filter, setFilter, mode, setMode, useBrandColor, setuseBrandColor, is_Loading_Filter, is_Loading_Mode}) => {

    const isDomainActive = mode === 'domain';
    const isFocusActive = mode === 'focus';

    const handleDomainClick = () => {
    setMode(isDomainActive ? 'none' : 'domain');
    }

    const handleFocusClick =() => {
    setMode(isFocusActive ? 'none' : 'focus');
    }
    
  return (
    <div className={`h-11 border-b-2  border-[#534B52] flex p-1 text-white items-center justify-evenly ${className} bg-[#262624]`}>
        <select disabled={is_Loading_Filter}
                className="bg-[#333533] text-white border border-[#534B52] rounded-lg pl-2 pr-21 h-7.5 outline-none text-[14px] font-semibold cursor-pointer"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}>
            <option value="A_Z">A → Z</option>
            <option value="Z_A">Z → A</option>
            <option value="recent">Recent</option>
        </select>

        <div>
            <button 
                    onClick={handleDomainClick}
                    className='border-2 rounded-lg h-7.5 px-3  text-[12px] font-semibold cursor-pointer transition-all ease-in-out duration-250'
                    style={{
                        borderColor: isDomainActive?  "#4361ee" : "#534B52",
                        backgroundColor: isDomainActive?  "#4361ee" : "#333533",
                    }}
                    >By Domain
            </button>
        </div>

        <div>
            <FocusButton 
                enabled={isFocusActive}
                onToggle={handleFocusClick}
                useBrandColor={useBrandColor}
                setuseBrandColor={setuseBrandColor}
                />
        </div>
    </div>
  )
}

export default FilterBar