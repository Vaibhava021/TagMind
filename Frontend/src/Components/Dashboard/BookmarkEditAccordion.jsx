import React, { useState } from 'react'
import axios from 'axios'

const BookmarkEditAccordion = ({bookmark, selectedProfile, setEditingId, setOpenId, setIsPosting, folderMap, title, isvaultOpen}) => {
    const [tagInput,setTagInput] = useState('')

    const endpoint =`${import.meta.env.VITE_API_BASE_URL}bookmarks/bookmarks/`

    const [data,setData] = useState({
        title:
            bookmark.title || '',
        description:
            bookmark.description || '',
        device_type:
            bookmark.device_type || 'pc',
        tags:
            [...(bookmark.tag_names || [])]

    })

    
    const saveEdit = async()=>{
        setIsPosting(true)
        try{
            await axios.patch(`${endpoint}${bookmark.id}/`,
                {   
                    title:
                        title,
                    description:
                        data.description,
                    device_type:
                        data.device_type,
                    tags:
                        data.tags
                },
                {
                    params:{
                        profile:selectedProfile,
                        vault:isvaultOpen
                    }
                }
            )

            setEditingId(null)
        }
        catch(err){
            console.log(err)
        }
        finally{
            setIsPosting(false)
        }
        console.log("Vault State Edit:", isvaultOpen)
        console.log({
            profile: selectedProfile,
            vault: isvaultOpen
})
    }

    const cancelEdit = ()=>{
        setEditingId(null)
        setOpenId(null)
    }

    const globalKeys = (e)=>{
        if(
            e.key==='Escape'
        ){
            cancelEdit()
        }
        if(
            e.key==='Enter'
            &&
            !e.ctrlKey
        ){
            e.preventDefault()
            saveEdit()
        }
    }
return (

<div className='flex w-full'>
    <div className='flex flex-col px-3 py-1.75 w-3/5 gap-3'>
        <textarea
            value={data.description}
            className='border border-[#534B52] rounded p-2 text-white outline-none resize-none h-24 text-[11.5px]' 
            onKeyDown={(e)=>{
                if(e.key==='Escape'
                ){
                    cancelEdit()
                }
                if(e.key==='Enter'
                    &&
                    !e.ctrlKey
                ){
                    e.preventDefault()
                    saveEdit()
                }
            }}
            onChange={(e)=>{
                setData(prev=>({...prev,description:e.target.value}))
            }}
            />


        <div className='flex flex-wrap gap-x-1.5 gap-y-2 items-center'>
        {
            data.tags.map(
                (tag,index)=>(
                    <div key={index}
                        className='bg-[#F5F1ED] text-[#30302e] rounded-full px-2 text-[10px] font-bold flex items-center gap-1'>
                        {tag}
                        <button
                            className='text-[#30302e] hover:text-red-600 text-xs cursor-pointer'
                            onClick={()=>{
                                setData(prev=>({...prev,tags:
                                        prev.tags.filter((_,i)=>i!==index)
                                }))
                            }}
                            >
                            x
                        </button>
                    </div>
                )
            )
        }
        </div>

        <input value={tagInput}
            className='rounded border border-[#534B52] px-2 py-1 text-white outline-none text-[11px]'
            placeholder='tag,'
            onKeyDown={(e)=>{
                if(e.key==='Backspace' &&tagInput==='')
                {
                    setData(prev=>({...prev,tags:
                                        prev.tags.slice(0,-1)
                    }))
                }
                if(e.key==='Escape'
                ){
                    cancelEdit()
                }
                if( e.key==='Enter'
                ){
                    e.preventDefault()
                    saveEdit()
                }
            }}
            onChange={(e)=>{
                const value = e.target.value
                if(
                    value.includes(',')
                ){
                    const newTag =
                        value
                        .replace(',','')
                        .trim()
                        .toLowerCase()
                    if(newTag){
                        setData(prev=>({
                            ...prev,
                            tags:[
                                ...prev.tags,
                                newTag
                            ]
                        }))
                    }
                    setTagInput('')
                    return
                }
                setTagInput(value)
            }}
        />

    </div>

    <div className=' flex flex-col w-2/5 border-l border-[#534B52] px-3 py-1.75 text-[#c9c9c9] font-semibold text-[11.5px]'>
        <div className=' flex items-start border-b-2 border-[#534B52] pb-1 '>
            <div className='shrink-0'>
                Folder:
            </div>

            <div className=' flex items-start gap-1 min-w-0 flex-1 ml-1.5'>
                <span className=' h-1.75 w-1.75 rounded-full shrink-0 shadow-sm mt-0.75'
                    style={{backgroundColor:folderMap[bookmark.folder]?.color||"#db00b6"}}/>

                <h4 className='wrap-break-word leading-[1.2] min-w-0'>
                    {folderMap[bookmark.folder]?.name||"Uncategorized"}
                </h4>
            </div>
        </div>
        <div className=' flex flex-wrap items-center pt-1.5 gap-1.5 border-b-2 border-[#534B52] pb-1'>
            <div>
                Added:
            </div>
            <div>
                {new Date(bookmark.created_at).toLocaleDateString()}
            </div>
        </div>

    <div className=' flex items-center gap-2 pt-1.5'>
            <div className='flex gap-1.5 items-center'>
                <div className='shrink-0'>
                Device:
                </div>

                <select className='flex-1 bg-[#404040] border border-[#534B52] rounded px-2 py-1 text-white outline-none text-[11px]'
                    value={data.device_type}
                    onKeyDown={globalKeys}
                    onChange={(e)=>{
                        setData(prev=>({
                            ...prev,
                            device_type:
                                e.target.value
                        }))
                    }}
                    >
                    <option value='pc'>
                        PC
                    </option>
                    <option value='mobile'>
                        Mobile
                    </option>
                </select>
            </div>
            </div>
            <div className='mt-auto border-t pt-3 pb-2 border-[#534B52]'>
                <div className=' flex gap-2 w-full justify-center'>
                <button
                    onClick={saveEdit}
                    className=' bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-[12px] font-bold cursor-pointer'
                    >Save
                </button>

                <button
                    onClick={cancelEdit}
                    className=' bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-[12px] font-bold cursor-pointer'
                    >Cancel
                </button>
            </div> 
        </div>
    </div>
         
</div>
 
)
}

export default BookmarkEditAccordion