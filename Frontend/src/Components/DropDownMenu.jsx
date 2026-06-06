import React, { useEffect, useMemo, useState } from 'react'

const DropDownMenu = ({ className, folderData, selectedFolder, setSelectedFolder, isvaultOpen }) => {
    const [isOpen, setIsOpen] = useState(false)
    
    const [searchTerm, setSearchTerm] = useState("")
    
    const displayList = useMemo(() => {
        const allOptions = [{ "id": "none", "name": "Uncategorized", "accent_color": "#db00b6"},
            ...folderData
        ];
        
        return allOptions
            // 2. Filter: Remove the active selection and apply search
            .filter(f => f.id !== selectedFolder.id)
            .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
            
            // 3. Sort: Pin "none" (Uncategorized) to the top
            .sort((a, b) => {
            if (a.id === "none") return -1; // Move a to the top
            if (b.id === "none") return 1;  // Move b to the top
            
            // Default alphabetical sort for everything else
            return a.name.localeCompare(b.name);
            });
}, [folderData, selectedFolder, searchTerm, isvaultOpen]);

    const handleSelect = (folder) => {
        setSelectedFolder(folder);
        setIsOpen(false);
        setSearchTerm("");
    }

    useEffect(()=>{
        setSelectedFolder({ "id": "none", "name": "Uncategorized", "accent_color": "#db00b6" })
    }, [isvaultOpen])


  return (
    <div className={`relative ${className} w-full h-full`}>
        <div className='flex items-center justify-between w-full select-none h-full px-3 cursor-pointer'    
            onClick={() => setIsOpen(!isOpen)}>
                <div className='flex items-center gap-2 ml-1'>
                    <span className='w-2.25 h-2.25 rounded-full'
                        style={{ backgroundColor: selectedFolder.accent_color}}>
                    </span>
                    <h4 className='truncate'>{selectedFolder.name}</h4>
                </div>
            <i className={`ri-arrow-drop-down-line text-xl transition-all ease-in-out duration-100
                ${isOpen ? 'rotate-180' : 'rotate-0'} `}></i>
        </div>
        {isOpen && (
            <div className='absolute bottom-full left-0 w-full bg-[#262624] border border-[#6b6d6f] mb-1 rounded-md truncate flex flex-col'>
                <div className='overflow-y-auto flex-1 mr-0.5 min-h-0 max-h-20.5 hover-scrollbar '>

                {displayList.length>0 ? (
                    displayList.map((folder,) => (
                    <div className='flex items-center gap-2 text-[11.5px] cursor-pointer px-2.5 ml-1.25
                            hover:bg-[#333533] rounded-full mr-2 my-0.5 hover:text-white'
                        key={folder.id}
                        onClick={() =>{handleSelect(folder)}}
                        >
                        <span className='w-1.5 h-1.5 rounded-full'
                            style={{backgroundColor: folder.accent_color}}>
                            </span> 
                            <h4>{folder.name}</h4>
                    </div>
                ))
                ):(
                    <div className='px-3 py-2 text-[12px] italic text-[#6b6d6f]'>No folders found</div>
                    )}
                </div>
                <div>
                    <div className='border-t border-[#6b6d6f] py-1 px-2 bg-[#262624]'>
                    <input 
                        type="text"
                        placeholder="Search folder..."
                        className='w-full bg-[#333533] text-sm px-2 py-1 rounded outline-none'
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    </div>
                </div>
            </div>
        )}
    </div> 
  )
}

export default DropDownMenu