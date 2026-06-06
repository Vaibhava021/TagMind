import React, { useContext, useEffect, useMemo, useState } from 'react'
import { DomainContext } from '../context/DomainContext'
import BookmarkItem from './BookmarkItem';
import { useChromeStorage } from '../Hooks/useChromeStorage';
import axios from 'axios';

export const BookmarkView = ({ className, device, mode, folderData, bookmarks, useBrandColor, selectedFolder, setSelectedFolder, search, isPosting, setIsPosting, selectedProfile, 
                              filter, recentTags, setRecentTags, addRecentTag, isvaultOpen }) => {

  const {domain: currentSiteDomain} = useContext(DomainContext);
  const [openId, setOpenId] = useState(null);
  const endpoint = `${import.meta.env.VITE_API_BASE_URL}bookmarks/bookmarks/`;

  // editing flags 
  const [editingId,setEditingId] = useState(null)
  const [editData,setEditData] = useState({})

  // Context menu 
  const [contextMenu, setContextMenu] = useState(null)
  const [copied,setCopied] = useState(false)

  // Store tags 

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
        if(type === 'title'
        ){
            searchMatch =
                b.title
                ?.toLowerCase()
                .includes(value)
        }

        else if(type === 'tags'
        ){
            searchMatch =
                value === ''
                ? true
                : b.tag_names?.some(
                    tag=>
                    tag.toLowerCase().includes(value)
                )
        }
        else if(type === 'desc'
        ){
            searchMatch =b.description?.toLowerCase().includes(value)
        }
    }
    return (folderMatch && deviceMatch && searchMatch
    )
})


// ---------- SORTING ----------

  if(filter === 'A_Z'
  ){result.sort(
          (a,b)=>
          a.title
          .localeCompare(
              b.title
          )
      )
  }

  else if(filter === 'Z_A'
  ){
      result.sort(
          (a,b)=>
          b.title
          .localeCompare(
              a.title
          )
      )
  }

  else if(filter === 'recent'
  ){
      result.sort(
          (a,b)=> new Date(b.created_at)-new Date(a.created_at)
      )
  }
  return result
    }, [bookmarks, selectedFolder, device, search, filter]);


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
      // console.log("DELETE CLICKED")
      // console.log("ID:", id)
      // console.log("URL:", `${endpoint}${id}/`)
      
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

  useEffect(()=>{

    // console.log('currentSiteDomain:', currentSiteDomain);
    // console.log('bookmark domains:', filteredBookmarks.map(b => b.domain));
    checkTags()
    return rightClickMenu()
  }, [currentSiteDomain, filteredBookmarks, setContextMenu, search, allTags])


  return (
    <div className={`bg-[#111111] overflow-auto ${className} h-full pr-2 pt-2 pl-2 hover-scrollbar`}
          >
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