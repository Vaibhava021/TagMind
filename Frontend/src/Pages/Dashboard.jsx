import React, { useCallback, useEffect, useState } from 'react'
import { SearchSyncBar } from '../Components/Dashboard/SearchSyncBar.jsx'
import Leftpanel from '../Components/Dashboard/Leftpanel.jsx';
import RightPanel from '../Components/Dashboard/RightPanel.jsx';
// import {folders, savedBookmarks} from "../Data/data.js"
import { useChromeStorage } from '../Hooks/useChromeStorage.js';
import { authenticatedFetch, clearVaultToken, getVaultTokenExpiry } from '../api/session.js';

  const Dashboard = ({selectedProfile, setSelectedProfile, accounts, setAccounts, setLogState, LogState, isvaultOpen, setIsvaultOpen,
                      refreshAccounts,
  }) => {
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
    const [fetchError, setFetchError] = useState('')

    // Posting data to api 
    const [isPosting, setIsPosting] = useState(false)

    const fetchData = useCallback(async () => {
      try {
        const bookmarkRes = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}bookmarks/bookmarks/?profile=${selectedProfile}&vault=${isvaultOpen}`);
        const folderRes = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}bookmarks/folders/?profile=${selectedProfile}&vault=${isvaultOpen}`);

        if (!bookmarkRes.ok || !folderRes.ok) {
          if (isvaultOpen && (bookmarkRes.status === 403 || folderRes.status === 403)) {
            await clearVaultToken()
            setBookmarks([])
            setFolderData([])
            setIsvaultOpen(false)
            if (globalThis.chrome?.storage?.session) {
              await globalThis.chrome.storage.session.remove('vaultOpen')
            }
          }
          const status = !bookmarkRes.ok ? bookmarkRes.status : folderRes.status
          throw new Error(status === 401
            ? 'Your sign-in session could not be refreshed. Sign in again to load your bookmarks.'
            : `Unable to load bookmarks (HTTP ${status}). Check your connection and retry.`)
        }

        const bookmarkData = await bookmarkRes.json()
        const folderData = await folderRes.json()

        setBookmarks(bookmarkData)
        setFolderData(folderData)
        setFetchError('')
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
        setFetchError(err.message || 'Unable to load bookmarks. Check your connection and retry.')
      }
    }, [selectedProfile, isvaultOpen, setIsvaultOpen])

    useEffect(() => {
    //       console.log(
    //     "DASHBOARD PROFILE:",
    //     selectedProfile
    // )
      // console.log(isvaultOpen)
      // console.log(`${import.meta.env.VITE_API_BASE_URL}bookmarks/bookmarks/?profile=${selectedProfile}&vault=${isvaultOpen}`)
      fetchData()
    }, [isPosting, fetchData])

    useEffect(() => {
      if (!isvaultOpen) return undefined

      let timerId
      let cancelled = false
      const lockVault = async () => {
        await clearVaultToken()
        setBookmarks([])
        setFolderData([])
        setIsvaultOpen(false)
        if (globalThis.chrome?.storage?.session) {
          await globalThis.chrome.storage.session.remove('vaultOpen')
        }
      }

      getVaultTokenExpiry().then(expiry => {
        if (!cancelled) {
          timerId = setTimeout(lockVault, Math.max(0, expiry - Date.now()))
        }
      })

      return () => {
        cancelled = true
        clearTimeout(timerId)
      }
    }, [isvaultOpen, setIsvaultOpen])

    // Brand color 
    const [useBrandColor, setuseBrandColor] = useState(false);  

    // _____________________
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

          {fetchError && (
            <div className="mx-3 mt-2 rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-200" role="alert">
              <div className="flex items-center justify-between gap-3">
                <span>{fetchError}</span>
                <button
                  type="button"
                  onClick={fetchData}
                  className="shrink-0 underline underline-offset-2"
                >Retry</button>
              </div>
            </div>
          )}

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
                        refreshAccounts={refreshAccounts}
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
