import React, { useEffect, useState } from 'react'
import DropDownMenu from './DropDownMenu'
import axios from 'axios'

const SaveBookmark = ({ className = "", folderData, isPosting, setIsPosting, selectedProfile, open, isvaultOpen}) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const [selectedFolder, setSelectedFolder] = useState({ 
      "id": "none", 
      "name": "Uncategorized", 
      "accent_color": "#db00b6",
  })

  const endpoint = `${import.meta.env.VITE_API_BASE_URL}bookmarks/bookmarks/`;

  const getCurrentTab = () => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query(
            { active:true, currentWindow:true },
            (tabs) => {
                const currentTab = tabs[0];
                if (currentTab && currentTab.title !== 'New Tab'){
                  setTitle(currentTab.title || "");
                  setUrl(currentTab.url || "");
                }
            }
          );
      }
  };

  const detectDeviceType = () => {
    const ua = navigator.userAgent.toLowerCase()
    if (/android|iphone|ipad|ipod/.test(ua)){
        return 'mobile'
    }
    return 'pc'
  }

  const resetFileds = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setTagInput("");
    setSelectedTags([]);
  }

  const postData = async () => {
    if (!title || !url) return;
    setIsPosting(true)
    // console.log("selected Profile:", selectedProfile)
    try{
      const domain = new URL(url).hostname
      const device_type = detectDeviceType()
      
      const body = { 
            title, 
            url, 
            domain, 
            description, 
            device_type,
            tags: selectedTags,
            user: selectedProfile, 
            folder : selectedFolder.id === "none" ? null : selectedFolder.id,
            is_vault: isvaultOpen
          }
      // console.log("Vault State:",isvaultOpen)
      // console.log("Body:",body)
      // console.log(selectedFolder.id)
      const response = await axios.post(endpoint, body)
      // console.log(response.data)
     } catch(err){
        console.log(err)
     }
    resetFileds()
    setIsPosting(false)
  }

  const handleRemoveTag = (indexToRemove) => {
    setSelectedTags(prev => prev.filter((_, idx) => idx !== indexToRemove));
  }

  const handleTagInputChange = (e) => {
    const value = e.target.value;

    if (value.includes(',')) {
      const parts = value.split(',');
      const cleanTag = parts[0].trim().toLowerCase();

      if (cleanTag && !selectedTags.includes(cleanTag)) {
        setSelectedTags(prev => [...prev, cleanTag]);
      }
      setTagInput(parts[1] || "");
    } else {
      setTagInput(value);
    }
  }

  useEffect(() => {
    getCurrentTab();
  }, [])

  return (
    <div className={`${className} w-full bg-[#262624] text-[#b2b2b2] font-sans text-xs select-none flex flex-col px-2 ${open ? 'pb-1.5' : 'pb-0'}`}>
      <div className="flex gap-2 w-full pt-1.5">
        <div className="flex flex-col gap-0.5 w-1/2">
          <label className="text-[#b2b2b2] font-light text-[11px] ml-0.5">Title</label>
          <input  
            type="text" 
            placeholder='Bookmark title'
            value={title}
            onChange={(e)=> setTitle(e.target.value)} 
            className='outline-none focus:outline-none border rounded-md h-7 border-[#6b6d6f] text-[#b2b2b2] pl-3 pr-3 text-[13px] font-normal bg-[#333533]'
          />
        </div>
        <div className="flex flex-col gap-0.5 w-1/2">
          <label className="text-[#b2b2b2] font-light text-[11px] ml-0.5">URL</label>
          <input  
            type="text" 
            placeholder='https://...' 
            value={url}
            onChange={(e)=> setUrl(e.target.value)}
            className='outline-none focus:outline-none border rounded-md h-7 border-[#6b6d6f] text-[#b2b2b2] pl-3 pr-3 text-[13px] font-normal bg-[#333533]'
          />
        </div>
      </div>

      <div className="flex flex-col gap-0.5 w-full mt-1.5">
        <label className="text-[#b2b2b2] font-light text-[11px] ml-0.5">Tags</label>
        
        <div className="flex items-start gap-2 w-full ">
          
          <div className="w-1/2">
            <input  
              value={tagInput} 
              placeholder='tag1, tag2...' 
              onChange={handleTagInputChange}
              className='outline-none focus:outline-none border rounded-md h-7 w-full border-[#6b6d6f] text-[#b2b2b2] px-3 py-1 text-[13px] font-normal bg-[#333533] resize-none overflow-y-auto'
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            />
          </div>

          <div 
            className="w-1/2 h-full flex content-start overflow-x-auto overflow-y-hidden whitespace-nowrap gap-1.5 px-0.5"
            style={{
              scrollbarWidth: 'none',         
              msOverflowStyle: 'none',    
            }}
          >
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {selectedTags.length === 0 ? (
              <span className="text-gray-500 italic text-[11px] px-1">No tags added</span>
            ) : (
              selectedTags.map((tag, index) => (
                <span 
                  key={`${tag}-${index}`}
                  className="inline-flex items-center gap-1 bg-[#1e293b] text-[#38bdf8] border border-[#0369a1]/30 text-[10px] font-bold px-2 py-0.5 rounded shrink-0 h-5"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="text-[#38bdf8]/50 hover:text-red-400 font-black ml-0.5 transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-0.5 w-full ">
        <label className="text-[#b2b2b2] font-light text-[11px] ml-0.5 mt-1.5">Description</label>
        <input  
          type="text"
          placeholder='Optional notes' 
          value={description}
          onChange={(e)=> setDescription(e.target.value)}
          className='outline-none focus:outline-none border rounded-md h-9 w-full border-[#6b6d6f] text-[#b2b2b2] pl-3 pr-3 text-[13px] font-normal bg-[#333533]'
        />
      </div>


      <div className="flex items-center gap-1.5 mt-2 w-full">
        
        <div className="w-3/5 border rounded-md border-[#6b6d6f] bg-[#262624] text-[#bfbdbd] text-[13px] font-semibold h-8 ">
          <DropDownMenu 
              className={""}
              folderData={folderData}
              selectedFolder={selectedFolder}
              setSelectedFolder={setSelectedFolder}
              isvaultOpen={isvaultOpen}
            />
        </div>

        <button 
          onClick={postData}
          disabled={isPosting}
          className='w-2/5 border rounded-md h-8 border-[#6b6d6f] text-[#b2b2b2] text-[13px] bg-[#262624] font-semibold hover:scale-102 cursor-pointer active:scale-98 transition-all ease-in-out duration-100 disabled:opacity-50'
        >
          {isPosting ? 'Saving...' : 'Add Bookmark'}
        </button>

      </div>

    </div>
  )
}

export default SaveBookmark