import React, { useState } from 'react'
import FilterBar from './FilterBar'
import { BookmarkView } from './BookmarkView'
import SaveBookmark from './SaveBookmark'

const RightPanel = ({search, device, folderData, setFolderData, bookmarks, setBookmarks, useBrandColor, setuseBrandColor, 
                    mode, setMode, filter, setFilter, is_Loading_Filter, is_Loading_Mode, systemFolder, selectedFolder, setSelectedFolder,
                    isPosting, setIsPosting, selectedProfile, recentTags, setRecentTags, addRecentTag, isvaultOpen}) => {

  // Save panel collapse button 
  const [open, setOpen] = useState(true);
  
  return (
    <div className='flex-1 w-full h-full overflow-hidden bg-[#111111]'>
        <div className='flex flex-col h-full'>
            <FilterBar className="shrink-0" 
                        filter={filter}
                        setFilter={setFilter}
                        mode={mode}
                        setMode={setMode}
                        useBrandColor={useBrandColor}
                        setuseBrandColor={setuseBrandColor}
                        is_Loading_Filter={is_Loading_Filter}
                        is_Loading_Mode={is_Loading_Mode}
                        />

            <BookmarkView className="flex-1 overflow-auto " 
                          onToggle={() => setOpen(!open)} 
                          search = {search}
                          mode = {mode}
                          folderData = {folderData}
                          setFolderData = {setFolderData}
                          bookmarks = {bookmarks}
                          setBookmarks = {setBookmarks}
                          useBrandColor = {useBrandColor}
                          setuseBrandColor = {setuseBrandColor}
                          systemFolder = {systemFolder}
                          selectedFolder = {selectedFolder}
                          setSelectedFolder = {setSelectedFolder}
                          device = {device}
                          isPosting={isPosting}
                          setIsPosting={setIsPosting}
                          selectedProfile={selectedProfile}
                          filter={filter}
                          recentTags={recentTags}
                          setRecentTags={setRecentTags}
                          addRecentTag={addRecentTag}
                          isvaultOpen={isvaultOpen}
                          />

            <div className='relative shrink-0'>
              <div className='absolute bottom-full right-0 w-full flex justify-end z-20'>
                <button onClick={() => setOpen(!open)}
                      className='pointer-events-auto flex items-center justify-center bg-[#0496ff] 
                               text-[#fef9ff] border-t border-l border-[#534B52] rounded-tl-[10px] h-3 w-8 pl-1 pt-0.5'>
                  <i className={`ri-arrow-drop-down-line text-[22px] font-normal cursor-pointer ${open ? '':'rotate-180'}`}>
                  </i>
                </button>
              </div>

              <SaveBookmark 
                      className={`relative shrink-0 transition-all ease-in-out duration-250 overflow-hidden ${open ? 'max-h-54 opacity-100':'max-h-0'}`}
                      folderData={folderData}
                      isPosting={isPosting}
                      setIsPosting={setIsPosting}
                      selectedProfile={selectedProfile}
                      setBookmarks={setBookmarks}
                      open={open}
                      isvaultOpen={isvaultOpen}
                      />
            </div>
        </div>
    </div>
  )
}

export default RightPanel
