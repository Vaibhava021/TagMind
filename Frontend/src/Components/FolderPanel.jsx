import React, { useContext, useEffect, useMemo, useState } from 'react'
import { FolderItem } from './FolderItem';
import { DomainContext } from '../context/DomainContext';
import axios from 'axios'


const FolderPanel = ({mode, setMode, bookmarks, useBrandColor ,systemFolder, folderData, selectedFolder, setSelectedFolder, isPosting, setIsPosting, selectedProfile, isvaultOpen}) => {
  const {domain} = useContext(DomainContext);
  const totalBookmarks = bookmarks.length;

  // Folder CRUD flags
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("")
  const [editingName, setEditingName] = useState("")
  const [editingFolderId, setEditingFolderId] = useState(null)

  // Context menu 
  const [contextmenu, setContextmenu] = useState(null)

  // Folder api endpoint 
  const endpoint = `${import.meta.env.VITE_API_BASE_URL}bookmarks/folders/`;

  // Sorting folder in asceding form
  const sortedFolders = useMemo(()=>{
    if(!folderData) return [];
    return [...folderData].sort((a,b) => 
      a.name.localeCompare(b.name, undefined, {sensitivity:'base'})
  );
}, [folderData, isPosting]);


  // Combining fetched folder and system folders into one 
  const allFolders = [...systemFolder, ...sortedFolders]

  // finding ids of the glowing folder 
  const normalizeDomain = (url) => {
  if (!url) return '';

    return url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  };

const glowingFolderids = useMemo(() => {
  if (mode !== 'focus' || !domain) return new Set();

  const currentDomain = normalizeDomain(domain);

  const activeIds = bookmarks
    .filter(
      b => normalizeDomain(b.domain) === currentDomain
    )
    .map(
      b => b.folder === null
        ? 'none'
        : b.folder
    );

  return new Set(activeIds);
}, [bookmarks, domain, mode]);
  // counting number of bookmarks in each folder  
  const folderCounts = useMemo(() => {
    const counts = {};

    bookmarks.forEach(bookmark => {
        const id = bookmark.folder;

        counts[id] = (counts[id] || 0) + 1;
    });

    return counts;
}, [bookmarks, isPosting]);

  // Convert foldername to title case 
  const toTitleCase = (text) => {
    return text
      .trim()
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(' ');
  };

  // Creating folder 
  const createFolder = async () => {
    setIsPosting(true)
     try{
      const body = {
          name:
              toTitleCase(
                  folderName
              ),

          user:
              selectedProfile,
            
          is_vault: isvaultOpen


    }
      const response = await axios.post(endpoint, body)
      // console.log("folder created")
      // console.log(response.data)
     } catch(err){
        console.log(
        err.response?.data
    )
  }
    setFolderName('')
    setIsCreatingFolder(false)
    setIsPosting(false)
  }

  const righgtClickMenu = () => {
    const closeMenu = () => {
        setContextmenu(null);
    };
  
    window.addEventListener('click', closeMenu);
  
    return () => {
        window.removeEventListener('click', closeMenu);
    };
  }

  const updateFolder = async(id)=>{
    setIsPosting(true)
    try{
      await axios.patch( `${endpoint}${id}/`,
        {
          name: editingName
        },
        {
          params:{
            profile:selectedProfile,
            vault:isvaultOpen
          }
        }
      )
      setEditingFolderId(null)
    }
    catch(err){
      console.error(err)
    }
    finally{
      setIsPosting(false)
    }

    const response = await axios.patch(
      `${endpoint}${id}/`,
      {
          name: editingName
      },
      {
          params:{
              profile:selectedProfile,
              vault:isvaultOpen
          }
      }
    )

    console.log(
        "PATCH RESPONSE:",
        response.data
    ) 
}

  // System Folder flags to avoid changes 
  const isSystemFolder =
    contextmenu &&
    (
      contextmenu.folder.id === 'all' ||
      contextmenu.folder.id === 'none'
    );

    
  // delete folder 
  const deleteFolder = async (id) => {
      setIsPosting(true)
      try{
        await axios.delete(`${endpoint}${id}/`, {
          params: {
            profile:selectedProfile,
            vault:isvaultOpen
          }
        }
      )
      setContextmenu(false)
    } catch(err){
      console.error("Error deleting folder:", err)
    }
    setIsPosting(false)
  }
  
  useEffect(() => {
    righgtClickMenu()
}, []);

  return (
    <div className=' mb-0.2 flex flex-col min-h-0 h-full'>
        <h4 className='text-[#b2b2b2] text-[9px] uppercase font-bold ' > {isvaultOpen ? <i class="ri-lock-2-fill mr-2"></i> : <i className="ri-folder-fill mr-2 "></i>} FOLDERS</h4>
        <div className='text-white font-semibold mt-1.5 flex flex-col gap-1 overflow-y-auto flex-1 hover-scrollbar '>
          {allFolders.map((folder) => {
              const itemCount =
                  folder.id === 'all'
                      ? totalBookmarks
                  : folder.id === 'none'
                      ? folderCounts[null] || 0
                  : folderCounts[folder.id] || 0;

            return(
              <FolderItem
                      key={folder.id} 
                      name={folder.name}
                      item={itemCount}
                      folder_accent={folder.accent_color}
                      useBrandColor={useBrandColor}
                      shouldGlow={glowingFolderids.has(folder.id)}
                      isEditing={editingFolderId === folder.id}
                      editingName={editingName}
                      setEditingName={setEditingName}
                      onSaveEdit={()=>updateFolder(folder.id)}
                      onClick={() => {
                                    setSelectedFolder(folder.id);
                                    setEditingName(folder.name)
                                  }}
                      isActive={selectedFolder === folder.id}
                      onRightClick={(e) => {
                        setContextmenu({
                          x: e.clientX,
                          y: e.clientY,
                          folder
                        });
                      }}
                    
           />);
            })}
        </div>
        <div className='flex items-center font-light gap-1 text-[#b2b2b2] shrink-0 px-1 hover:bg-[#333533]  cursor-pointer rounded-2xl mb-0.2
                        active:scale-98 active:border-none overflow-hidden'>
          <i className='ri-add-line text-[14px] shrink-0'></i>
            <div className='capitalize text-[11px] flex-1 min-w-0'>
              {
                isCreatingFolder ? (
                    <div className='flex items-center gap-1 w-full'>
                      <input 
                      type="text" 
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      placeholder='Folder Name'   
                      className='flex-1 min-w-0 focus:outline-none focus:text-white'
                      autoFocus
                      onBlur={() => setIsCreatingFolder(false)}   
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          createFolder();
                        }
                      }}                          
                    />
                  
                    <button onClick={createFolder} 
                            onMouseDown={(e) => e.preventDefault()}
                            className='cursor-pointer shrink-0'>
                      Save
                    </button>
                    </div>
                ) : (
                  <div
                    onClick={() => setIsCreatingFolder(true)} 
                    className="cursor-pointer select-none"

                  >
                    New Folder 
                  </div>
                )
              }
            </div>
        </div>
        {
        contextmenu && !isSystemFolder && (

        <div
            className='fixed z-100 bg-[#2d2d2d]
                      border border-[#555]
                      rounded-md shadow-lg
                      overflow-hidden text-[11px]
                      text-white
                      flex flex-col
                      w-15
                      '

            style={{
                left: contextmenu.x,
                top: contextmenu.y
            }}
        >

            <button
                className='w-full text-left px-2 py-0.75
                          hover:bg-[#404040] cursor-pointer'
                onClick={() => {
                    setEditingFolderId(
                        contextmenu.folder.id
                    )

                    setEditingName(
                        contextmenu.folder.name
                    )

                    setContextmenu(null)
                }}
            >
                Edit
            </button>

            <button
                className='w-full text-left px-2 py-0.75
                          hover:bg-red-600 cursor-pointer'
                onClick={()=>{
                    // console.log("Delete", contextmenu.folder.id)
                    deleteFolder(contextmenu.folder.id)
                    setContextmenu(null)
                }}
            >
                Delete
            </button>

        </div>
      )
    }
    </div>
  )
}

export default FolderPanel