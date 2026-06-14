import React, { useEffect, useState } from 'react'
import axios from 'axios';
import BookmarkEditAccordion from './BookmarkEditAccordion';

const BookmarkItem = ({bookmark, index, openId, setOpenId, mode, folderMap, domain, useBrandColor, handleToggle, onRightClick, editingId, setEditingId, selectedProfile, setIsPosting,
                      isvaultOpen, registerRef}) => {
    
    const isOpen = openId === bookmark.id

    // striping www 
    const cleanDbDomain = bookmark.domain?.toLowerCase().replace(/^www\./, '') || '';
    const cleanCurrentDomain = domain?.toLowerCase().replace(/^www\./, '') || '';
    
    // editing flags 
    const isEditing = editingId === bookmark.id

    // Boolean flag to flag styles
    const isDomainMatched = mode === 'focus' && cleanDbDomain === cleanCurrentDomain;

    const [title, setTitle] = useState(bookmark.title)

    useEffect(() => {
      // console.log("Tags:",bookmark.tag_names)
    //   console.log({
    //   title: bookmark.title,
    //   top: rect.top,
    //   bottom: rect.bottom,
    //   containerTop: containerRect.top,
    //   containerBottom: containerRect.bottom
    // })
    }, []);

  return (
         <div ref={registerRef}
              onContextMenu={onRightClick}
              className='flex flex-col rounded-lg border overflow-hidden transition-all ease-in-out duration-350'
                    style={{
                      // Use the normalized match flag here 
                      borderColor: isDomainMatched ? useBrandColor : "#534B52",
                      boxShadow: isDomainMatched ? `0 0 8px ${useBrandColor}` : 'none',
                      
                      opacity: mode === 'focus'
                        ? (cleanDbDomain === cleanCurrentDomain ? 1 : 0.45) 
                        : 1,
                        
                      filter: mode === 'focus'
                        ? (cleanDbDomain === cleanCurrentDomain ? 'none' : 'grayscale(50%)')
                        : 'none',
                    }}
                    >
                      <div className='flex items-center gap-2 pl-3 pr-2 h-8 bg-[#30302e] select-none'>
                        <img
                          className='h-4 w-4 cursor-pointer shrink-0'
                          src={`https://www.google.com/s2/favicons?sz=64&domain=${bookmark.domain}`}
                          onClick={() => window.open(bookmark.url, '_blank')}
                          alt=""
                        />
                        <div
                          className={` cursor-pointer text-white text-[13px] flex-1 select-none
                                      ${isOpen ? "font-extrabold" : "font-normal" }
                                      ${!isEditing? "truncate":""}`}
                          onClick={!isEditing ? () => window.open(bookmark.url, '_blank'): undefined}
                          >
                          {isEditing
                          ? <div>
                              <input type="text" 
                                     value={title}
                                     autoFocus
                                     onChange={(e)=> setTitle(e.target.value)}
                                     className='w-full bg-transparent outline-none p-0 m-0 focus:outline-none focus:ring-0 border-none'/>
                                      </div>
                            :bookmark.title}
                          </div>
                        <button
                          className='h-4.5 border rounded-[7px] flex items-center px-1 border-[#80777e] justify-center cursor-pointer shrink-0'
                          onClick={() =>{
                                if(isOpen){
                                  setEditingId(null)
                                } 
                                handleToggle(bookmark.id)}}
                        >
                          <i className={`ri-arrow-drop-down-line text-white text-[20px] font-extralight transition-transform duration-300
                                        ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                          </i>
                        </button>
                      </div>

                      <div
                        className={`bg-[#30302e] overflow-hidden transition-all ease-in-out duration-300
                                    ${isOpen ? 'max-h-250 opacity-100 border-t border-[#534B52]' : 'max-h-0 opacity-0'}`}
                      >
                        <div className=' text-white text-[12px]'>
                          {isEditing 
                          ?
                           <BookmarkEditAccordion bookmark={bookmark}
                                                  selectedProfile={selectedProfile}
                                                  setEditingId={setEditingId}
                                                  setOpenId={setOpenId}
                                                  setIsPosting={setIsPosting}
                                                  folderMap={folderMap}
                                                  title={title}
                                                  isvaultOpen={isvaultOpen}
                            />
                          :
                           (
                            <div className='flex w-full'>
                              <div className='flex flex-col px-3 py-1.75 w-3/5 gap-3.5'>
                              {
                              bookmark.description 
                              ? (
                                <div className={`text-[#c9c9c9] font-semibold text-[11.5px]`}>
                                    {bookmark.description}
                                </div>
                              ):(
                                <div className='text-[#8a8a8a] italic text-[11.5px]'>
                                  No description
                                </div>
                              )
                              }
                                <div className='flex items-center gap-1.5 text-[#30302e] mt-auto mb-1.5 overflow-x-auto [ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden'>
                                {
                                    bookmark.tag_names?.length > 0
                                    ? (
                                        bookmark.tag_names.map(
                                            (tag,index)=>(
                                                <div key={index}
                                                    className='bg-[#F5F1ED] px-2 rounded-full text-[10px] font-bold shrink-0 '>
                                                    {tag}
                                                </div>
                                            )
                                        )
                                    )
                                    : (
                                        <div className='text-[#8a8a8a] italic text-[10px]'>
                                            No tags
                                        </div>
                                    )
                                }
                                </div>
                              </div>
                              <div className='flex flex-col w-2/5 border-l border-[#534B52] px-3 py-1.75 text-[#c9c9c9] font-semibold text-[11.5px]'>
                                <div className='flex items-start border-b-2 border-[#534B52] '>
                                  <div className='shrink-0'>Folder:</div>
                                  <div className='flex items-start gap-1 min-w-0 flex-1 ml-1.5'>
                                    <span className={`h-1.75 w-1.75 rounded-full shrink-0 shadow-sm mt-0.75`} 
                                        style={{
                                            backgroundColor:
                                              folderMap[bookmark.folder]?.color || "#db00b6"
                                          }}
                                        >
                                        </span>
                                        <h4 className='wrap-break-word leading-[1.2] min-w-0'>{folderMap[bookmark.folder]?.name || "Uncategorized"}</h4> 
                                  </div>
                                </div>
                                <div className='flex flex-wrap items-center pt-1.5 gap-1.5 border-b-2 border-[#534B52] pb-1'>
                                  <div>Added:</div>
                                  <div>{new Date(bookmark.created_at).toLocaleDateString()}</div>
                                </div>
                                <div className='flex items-center gap-1.5 pt-1.5 capitalize border-[#534B52] pb-1'>Device: <span className='pl-1'>{bookmark.device_type}</span></div>
                              </div>
                          </div>

                           ) 
                          }
                        </div>
                      </div>
                </div>
  )
}

export default BookmarkItem