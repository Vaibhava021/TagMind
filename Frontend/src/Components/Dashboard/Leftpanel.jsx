import React, { useState } from 'react'
import FolderPanel from './FolderPanel'
import TagPanel from './TagPanel'
import StatsPanel from './StatsPanel'
import VaultModal from './VaultModal'

const Leftpanel = ({folderData, useBrandColor, setuseBrandColor, mode, setMode, bookmarks, systemFolder, selectedFolder, setSelectedFolder, 
                    isPosting, setIsPosting, selectedProfile, setAccounts, accounts, setSelectedProfile, recentTags, setRecentTags, 
                    addRecentTag, setSearch, LogState, setLogState, isvaultOpen, setIsvaultOpen, folderAction, setFolderAction, refreshAccounts}) => {

const [showVaultModal, setShowVaultModal] = useState(false)

  return (
    <div className='h-full border-r border-[#534B52] w-48 p-2.5 flex flex-col'>
      <div className='flex-1 overflow-y-auto '>
        <FolderPanel 
                    folderData={folderData} 
                    useBrandColor={useBrandColor} 
                    setuseBrandColor={setuseBrandColor} 
                    mode={mode} 
                    setMode={setMode} 
                    bookmarks={bookmarks} 
                    systemFolder={systemFolder} 
                    selectedFolder={selectedFolder}
                    setSelectedFolder={setSelectedFolder}
                    isPosting={isPosting}
                    setIsPosting={setIsPosting}
                    selectedProfile={selectedProfile}
                    isvaultOpen={isvaultOpen}
                    folderAction={folderAction}
                    setFolderAction={setFolderAction}
                    />
      </div>
      <div className='shrink-0'>
        <TagPanel selectedProfile={selectedProfile}
                  recentTags={recentTags}
                  setRecentTags={setRecentTags}
                  addRecentTag={addRecentTag}
                  setSearch={setSearch}
                  isvaultOpen={isvaultOpen}
                  />

        <StatsPanel
                  selectedProfile={selectedProfile}
                  accounts={accounts}
                  setAccounts={setAccounts}
                  setSelectedProfile={setSelectedProfile}
                  bookmarks={bookmarks}
                  LogState={LogState}
                  setLogState={setLogState}
                  setIsvaultOpen={setIsvaultOpen}
                  isvaultOpen={isvaultOpen}
                  onvaultOpen={()=>{setShowVaultModal(true)}}
                  />
      </div>
      {showVaultModal && (
        <VaultModal
                  selectedProfile={selectedProfile}
                  accounts={accounts}   
                  onClose={() => setShowVaultModal(false)} 
                  isvaultOpen={isvaultOpen}
                  setIsvaultOpen={setIsvaultOpen}
                  />
      )}
    </div>
  )
}

export default Leftpanel