import React, { useEffect, useState } from 'react'
import { SearchSyncBar } from '../Components/Dashboard/SearchSyncBar.jsx'
import Leftpanel from '../Components/Dashboard/Leftpanel.jsx';
import RightPanel from '../Components/Dashboard/RightPanel.jsx';
// import {folders, savedBookmarks} from "../Data/data.js"
import { useChromeStorage } from '../Hooks/useChromeStorage.js';

  const Dashboard = ({selectedProfile, setSelectedProfile, accounts, setAccounts, setLogState, LogState, isvaultOpen, setIsvaultOpen}) => {
    // Search bar 
    const [search, setSearch] = useState("");

    // Selected device 
    const [device, setDevice, isLoading_Device] = useChromeStorage('device', 'all');

    // recentTags 
    const [recentTags, setRecentTags] = useChromeStorage('recentTags', {})
    const addRecentTag = (tagName) => {
      if (!tagName?.trim())
          return

      const storageKey = `${selectedProfile}_${isvaultOpen ? 'vault' : 'normal'}`
      const currentProfileTags = recentTags[storageKey] || []
      const updated = [tagName,...currentProfileTags.filter(t => t !== tagName)]
      setRecentTags({
          ...recentTags,
          [storageKey]:
              updated.slice(0, 20)
      })
  }

    const [bookmarks, setBookmarks] = useState([])
    const [folderData, setFolderData] = useState([])
    const [loading, setLoading] = useState(true)

    // Posting data to api 
    const [isPosting, setIsPosting] = useState(false)

    async function fetchData() {
      try {
        const bookmarkRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}bookmarks/bookmarks/?profile=${selectedProfile}&vault=${isvaultOpen}`);
        const folderRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}bookmarks/folders/?profile=${selectedProfile}&vault=${isvaultOpen}`);

        const bookmarkData = await bookmarkRes.json()
        const folderData = await folderRes.json()

        setBookmarks(bookmarkData)
        setFolderData(folderData)
        // console.log(
        //       "Fetched Bookmarks:",
        //       bookmarkData.length
        //   )

        //   console.log(
        //       "Fetched Folders:",
        //       folderData.length
        //   )
      }
      catch(err){
        console.error(err)
      }
      finally{
        setLoading(false)
      }
    }

    useEffect(() => {
    //       console.log(
    //     "DASHBOARD PROFILE:",
    //     selectedProfile
    // )
      // console.log(isvaultOpen)
      // console.log(`${import.meta.env.VITE_API_BASE_URL}bookmarks/bookmarks/?profile=${selectedProfile}&vault=${isvaultOpen}`)
      fetchData()
    }, [isPosting, selectedProfile, isvaultOpen])

    // Brand color 
    const [useBrandColor, setuseBrandColor] = useState(false);  

    // _____________________
    const isExtension = window.location.protocol === 'chrome-extension:';

    // Mode Focus Domain None 
    const [mode, setMode, is_Loading_Mode] = useChromeStorage('focusmode', 'none');

    // set filter 
    const [filter, setFilter, is_Loading_Filter] = useChromeStorage('filter', 'recent');

    // set selected folder 
    const [selectedFolder, setSelectedFolder] = useState('all')

    const systemFolder = [  { "id": "all", "name": "All Bookmarks", "accent_color": "#0496ff" },
                        { "id": "none", "name": "Uncategorized", "accent_color": "#db00b6" },]

    // folder action 
    const [folderAction, setFolderAction] = useState(null)
          

    return (
      <div className='bg-[#262624] h-150 w-145 flex flex-col overflow-hidden' >
          <SearchSyncBar 
                        search={search}
                        setSearch={setSearch}
                        device={device}
                        setDevice={setDevice}
                        isLoading_Device={isLoading_Device}
                        />

          <div className='flex flex-1 min-h-0'>
              <Leftpanel
                        folderData = {folderData}
                        mode={mode}
                        setMode={setMode}
                        bookmarks = {bookmarks}
                        useBrandColor={useBrandColor}
                        systemFolder={systemFolder}
                        selectedFolder={selectedFolder}
                        setSelectedFolder={setSelectedFolder}
                        isPosting={isPosting}
                        setIsPosting={setIsPosting}
                        accounts={accounts}
                        setAccounts={setAccounts}
                        selectedProfile={selectedProfile}
                        setSelectedProfile={setSelectedProfile}
                        recentTags={recentTags}
                        setRecentTags={setRecentTags}
                        addRecentTag={addRecentTag}
                        setSearch={setSearch}
                        setLogState={setLogState}
                        LogState={LogState}
                        isvaultOpen={isvaultOpen}
                        setIsvaultOpen={setIsvaultOpen}
                        folderAction={folderAction}
                        setFolderAction={setFolderAction}
                        />
              <RightPanel
                        mode={mode}
                        setMode={setMode}
                        folderData = {folderData}
                        setFolderData = {setFolderData}
                        bookmarks = {bookmarks}
                        setBookmarks = {setBookmarks}
                        search={search}
                        device={device}
                        useBrandColor={useBrandColor}
                        setuseBrandColor={setuseBrandColor}
                        filter = {filter}
                        setFilter = {setFilter}
                        selectedFolder={selectedFolder}
                        setSelectedFolder={setSelectedFolder}
                        is_Loading_Filter={is_Loading_Filter}
                        is_Loading_Mode={is_Loading_Mode}
                        systemFolder={systemFolder}
                        isPosting={isPosting}
                        setIsPosting={setIsPosting}
                        selectedProfile={selectedProfile}
                        recentTags={recentTags}
                        setRecentTags={setRecentTags}
                        addRecentTag={addRecentTag}
                        isvaultOpen={isvaultOpen}
                        folderAction={folderAction}
                        setFolderAction={setFolderAction}
                        />
          </div>
      </div>
    )
  }

  export default Dashboard
