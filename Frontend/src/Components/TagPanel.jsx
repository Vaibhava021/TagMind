import React from 'react'
import { useChromeStorage } from '../Hooks/useChromeStorage'

const TagPanel = ({selectedProfile, recentTags, setSearch, isvaultOpen}) => {
  const storageKey =`${selectedProfile}_${isvaultOpen ? 'vault' : 'normal'}`

  const tagsdata = recentTags[storageKey] || []
  return (
      <div className='border-b-2 border-[#534B52] pb-2 mb-2.5 h-28 border-t-2 flex flex-col shrink-0'>
        <h4 className='text-[#b2b2b2] font-bold text-[9px] uppercase
                      border-[#534B52] mt-2 mb-1.5 shrink-0 flex items-center'>
                        <i className="ri-price-tag-3-fill mr-2"></i>
                        TAGS</h4>
        <div className='flex flex-wrap gap-2 overflow-hidden flex-1 content-start'>
          {tagsdata.map(function(tag,idx){
            return <button className='border border-[#8A8D91] rounded-full px-2 text-white font-extralight text-[11px]
                                      cursor-pointer hover:scale-103 transition-all duration-75 ease-in-out' key={idx} onClick={() => setSearch("tags:" + tag)}>
                      {tag}
                    </button>
          })}
        </div>
      </div>
  )
}

export default TagPanel