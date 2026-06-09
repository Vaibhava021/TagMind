import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DomainContext } from '../../context/DomainContext'
import BookmarkItem from './BookmarkItem';
import { useChromeStorage } from '../../Hooks/useChromeStorage';
import axios from 'axios';

export const BookmarkView = ({ className, device, mode, folderData, bookmarks, useBrandColor, selectedFolder, setSelectedFolder, search, isPosting, setIsPosting, selectedProfile, 
                              filter, recentTags, setRecentTags, addRecentTag, isvaultOpen, open }) => {

  const {domain: currentSiteDomain} = useContext(DomainContext);
  const [openId, setOpenId] = useState(null);
  const endpoint = `${import.meta.env.VITE_API_BASE_URL}bookmarks/bookmarks/`;

  // editing flags 
  const [editingId,setEditingId] = useState(null)
  const [editData,setEditData] = useState({})

  // Context menu 
  const [contextMenu, setContextMenu] = useState(null)
  const [copied,setCopied] = useState(false)

  // For arrow indication 
  const containerRef = useRef(null)
  const bookmarkRefs = useRef({})
  const [focusIndicators, setFocusIndicators] = useState({above: 0, below: 0, visible: 0})


  const parseSearch = (search) => {
    if (!search) return { type: 'title', value: '' };

    const trimmed = search.toLowerCase().trim();

    const prefixes = ['tags:', 'desc:', 'url:'];

    for (let prefix of prefixes) {
      if (trimmed.startsWith(prefix)) {
        return {
          type: prefix.slice(0, -1),
          value: trimmed.slice(prefix.length).trim()
        };
      }
    }

    return { type: 'title', value: trimmed };
  }

  const filteredBookmarks = useMemo(() => {
    const {type,value} = parseSearch(search.toLowerCase())
    const result = bookmarks.filter(b => {

    const folderMatch =
        selectedFolder === 'all' ||
        (
            selectedFolder === 'none'
            ? b.folder === null
            : String(b.folder) === String(selectedFolder)
        )
    const deviceMatch =
        device === 'all' || b.device_type === device

    let searchMatch = true
    if(search){
        if(type === 'title')
        {
            searchMatch =
                b.title
                ?.toLowerCase()
                .includes(value)
        }

        else if(type === 'tags')
        {
            searchMatch =value === ''
                ? true
                : b.tag_names?.some(tag=>tag.toLowerCase().includes(value))
        }
        else if(type === 'desc')
        {
            searchMatch =b.description?.toLowerCase().includes(value)
        }
    }
    return (folderMatch && deviceMatch && searchMatch
    )
})

// ---------- SORTING ----------

    if(filter === 'A_Z')
      {
        result.sort((a,b)=>a.title.localeCompare(b.title))
      }

    else if(filter === 'Z_A')
      {
        result.sort((a,b)=>b.title.localeCompare(a.title))
      }

    else if(filter === 'recent')
      {
        result.sort((a,b)=> new Date(b.created_at)-new Date(a.created_at))
      }
  return result
    }, [bookmarks, selectedFolder, device, search, filter]);

  const matchedBookmarks = useMemo(() => {
    const cleanCurrent =
      currentSiteDomain?.toLowerCase().replace(/^www\./, '');

    return filteredBookmarks.filter(bookmark => {
      const cleanBookmark =
        bookmark.domain?.toLowerCase().replace(/^www\./, '');

      return cleanBookmark === cleanCurrent;
    });
  }, [filteredBookmarks, currentSiteDomain]);
    

  const groupedBookmarks = useMemo(() => {
    if (mode !== 'domain') return {};

    const groups = {};
    filteredBookmarks.forEach(b => {
      const d = b.domain || 'Unknown';
      if (!groups[d]) groups[d] = [];
      groups[d].push(b);
    });
    return groups;
  }, [filteredBookmarks, mode]);

  const handleToggle = (id) => {
    setOpenId(prevId => prevId === id ? null : id);
  };

  const folderMap = useMemo(() => {
    const map = {};
    folderData.forEach(f => {
      map[f.id] = { name: f.name, color: f.accent_color }
    });
    return map;
  }, [folderData]);

  const rightClickMenu = () => {
    const closeMenu = (e) => {
      if (e.target.closest('.custom-context-menu'))
        return;
      setContextMenu(null);
    };

    window.addEventListener('click', closeMenu);
    return () => {
      window.addEventListener('click', closeMenu);
    };
  }
  
  const deleteBookmark = async (id) => {
      setIsPosting(true)
      try {
        await axios.delete(`${endpoint}${id}/`,
          {
            params:{
              profile:selectedProfile,
              vault:isvaultOpen
            }
          }
        )
        // console.log("DELETE SUCCESS")
        setContextMenu(null)
        setIsPosting(false)

      } catch(err) {
          console.error("DELETE ERROR:", err)
          console.error(err.response)
      }
  }

  const allTags = useMemo(()=>{
    return [
        ...new Set(
            bookmarks.flatMap(
                b => b.tag_names || []
            )
        )
    ]
  },[bookmarks])

  const checkTags = () =>{
    const {type, value} = parseSearch(search)
    if(type !== 'tags' ||  !value){
      return
    }
    const exactMatch = allTags.find(tag => tag.toLowerCase() === value.toLowerCase())
    if(exactMatch){
      addRecentTag(exactMatch)
    }
  }

  // const calculateFocusIndicators = () => {
  //    if(mode !== 'focus')
  //     {
  //       setFocusIndicators({
  //         above: 0,
  //         below: 0
  //       })
  //       return
  //     }

  //   if (!containerRef.current)
  //     return

  //   const containerRect = containerRef.current.getBoundingClientRect()
  //   let above = 0
  //   let below = 0
    

  //   matchedBookmarks.forEach(bookmark => {
  //     const element = bookmarkRefs.current[bookmark.id]
  //     if (!element)
  //       return
  //     const rect = element.getBoundingClientRect()
  //     if (rect.bottom < containerRect.top) {
  //       above++
  //     }
  //     else if (rect.top > containerRect.bottom) {
  //       below++
  //     }
  //   })

  //   // console.log({above,below})
  //   setFocusIndicators({above,below})
  // }

  const calculateFocusIndicators = () => {

  if (mode !== 'focus') {
    setFocusIndicators({
      above: 0,
      below: 0
    })
    return
  }

  if (!containerRef.current)
    return

  const containerRect = containerRef.current.getBoundingClientRect()

  let above = 0
  let below = 0
  let visible = 0

  matchedBookmarks.forEach(bookmark => {

    const element = bookmarkRefs.current[bookmark.id]
    if (!element)
      return
    const rect = element.getBoundingClientRect()

    const isVisible =
      rect.bottom > containerRect.top &&
      rect.top < containerRect.bottom

    if (isVisible) {
      visible++
    }
    else if (rect.bottom <= containerRect.top) {
      above++
    }
    else if (rect.top >= containerRect.bottom) {
      below++
    }

  })

  console.log({
    totalMatches: matchedBookmarks.length,
    above,
    visible,
    below,
    sum: above + visible + below
  })

  setFocusIndicators({above, below, visible})
}

  useEffect(()=>{
    // console.log("Matched Bookmarks:", matchedBookmarks)
    // console.log("Matched Bookmarks:", matchedBookmarks.map(b => b.title))
    // console.log("Bookmark Refs:")
    // console.log(bookmarkRefs.current)

    calculateFocusIndicators()
    checkTags()
    return rightClickMenu()
  }, [currentSiteDomain, filteredBookmarks, setContextMenu, search, allTags, openId, mode, open])


  return (
    <div ref={containerRef} 
          onScroll={calculateFocusIndicators}
          className={`bg-[#111111] relative overflow-auto ${className} h-full pr-2 pt-2 pl-2 hover-scrollbar`}>
        {
          mode === "focus" &&
          (focusIndicators.above > 0 || focusIndicators.below > 0) && (
            <div className={`fixed ${open ? 'bottom-58' : 'bottom-4'} right-3 -translate-y-1/5 flex flex-col items-center gap-0.75 z-9999 animate-pulse transition-all ease-in-out duration-250`}>

              {focusIndicators.above > 0 && (
                <button
                  className="w-6 h-5 rounded-lg border border-zinc-700 bg-[#1a1a1a] hover:bg-[#252525] text-white flex items-center justify-center transition-all text-[15px] cursor-pointer
                      hover:animate-none"
                ><i className="ri-arrow-up-s-fill"></i>
                </button>
              )}

              <div className="px-2 py-0.5 rounded-lg border-[1.5px] font-bold border-[#db00b6] bg-[#111111] text-[#db00b6] text-[12px]">
                  {focusIndicators.visible}/
                  {matchedBookmarks.length}
              </div>

              {focusIndicators.below > 0 && (
                <button
                  className="w-6 h-5 rounded-lg border border-zinc-700 bg-[#1a1a1a] hover:bg-[#252525] text-white flex items-center justify-center transition-all text-[15px] cursor-pointer
                      hover:animate-none"
                ><i className="ri-arrow-down-s-fill"></i>
                </button>
              )}
            </div>
          )
        }

          <div className='w-full flex flex-col gap-1.25'>
            {filteredBookmarks.length === 0 ? (
              <div className='text-[#b2b2b2] text-[13px] italic'
                    onContextMenu={(e) => {
                      e.preventDefault()
                    }}>No bookmarks found..</div>
            ) : mode === 'domain' ? (
              Object.entries(groupedBookmarks).map(([domainGroup, items]) => (
                <div key={domainGroup} className="flex flex-col gap-1.5 mb-3">
                  <div className='flex items-center gap-2 opacity-60 px-1'>
                    <img 
                      src={`https://www.google.com/s2/favicons?sz=64&domain=${domainGroup}`} 
                      className="w-3 h-3" 
                      alt="" 
                    />
                    <span className="text-[9px] font-black uppercase tracking-normal text-[#c9c9c9]">
                      {domainGroup} — {items.length} Items
                    </span>
                    <div className="h-px flex-1 bg-[#534B52]"></div>
                  </div>

                  {items.map((bookmark) => (
                    <BookmarkItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        openId={openId}
                        handleToggle={handleToggle}
                        mode={mode}
                        domain={currentSiteDomain} 
                        useBrandColor={useBrandColor}
                        folderMap={folderMap}
                        editingId={editingId}
                        setEditingId={setEditingId}
                        selectedProfile={selectedProfile}
                        setOpenId={setOpenId}
                        setIsPosting={setIsPosting}
                        isvaultOpen={isvaultOpen}
                        registerRef={(el) => {
                          bookmarkRefs.current[bookmark.id] = el
                        }}
                        onRightClick={(e) => {
                              e.preventDefault();
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                bookmark
                              });
                            }}
                      
                        />
                      ))}
                    </div>
                  ))
                ) : (
                  filteredBookmarks.map((bookmark) => (
                    <BookmarkItem
                      key={bookmark.id}
                      bookmark={bookmark}
                      openId={openId}
                      handleToggle={handleToggle}
                      mode={mode}
                      domain={currentSiteDomain}
                      useBrandColor={useBrandColor}
                      folderMap={folderMap}
                      editingId={editingId}
                      setEditingId={setEditingId}
                      selectedProfile={selectedProfile}
                      setOpenId={setOpenId}
                      setIsPosting={setIsPosting}
                      isvaultOpen={isvaultOpen}
                      registerRef={(el) => {
                        bookmarkRefs.current[bookmark.id] = el
                      }}
                      onRightClick={(e) => {
                          e.preventDefault()
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            bookmark
                          });
                        }}
                    />
                  ))
                )}
              </div>
          { contextMenu && (
          <div
              className='custom-context-menu fixed cursor-pointer z-100 bg-[#2d2d2d] b order border-[#555] rounded-md shadow-l overflow-hidden text-[11px] 
                      text-white flex flex-col w-24'
              style={{
                  left: contextMenu.x,
                  top: contextMenu.y
              }}
            >
              <button className='w-full text-left px-2 py-0.75 hover:bg-[#404040] cursor-pointer'
                  onClick={()=>{
                      setEditingId(
                          contextMenu.bookmark.id
                      )
                      setOpenId(
                          contextMenu.bookmark.id
                      )
                      setContextMenu(null)
                    }}
                  >Edit
              </button>

              <button className='w-full text-left px-2 py-0.75 hover:bg-red-600 cursor-pointer'
                  onClick={()=>{
                      // console.log("Delete CLICKED")
                      // console.log(contextMenu)
                      deleteBookmark(contextMenu.bookmark.id)
                  }}
                  >Delete
              </button>

              <button className='w-full text-left px-2 py-0.75 hover:bg-[#404040] cursor-pointer'
                  onClick={async()=>{
                    setContextMenu(null)
                    await navigator.clipboard.writeText(
                          contextMenu.bookmark.url
                      )
                      setCopied(true)
                      setTimeout(()=>{
                          setCopied(false)
                      },1500)
                  }}
                >Copy Link
              </button>

        </div>)}
    </div>
  )
}