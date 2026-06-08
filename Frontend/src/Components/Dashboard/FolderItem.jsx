import React, { useEffect } from 'react'

export const FolderItem = ({name, item, shouldGlow, folder_accent, useBrandColor, onClick, isActive, onRightClick, isEditing, editingName, setEditingName, onSaveEdit}) => {  
      useEffect(() => {
            // console.log(name,shouldGlow)
      }, [])
      
  return (
      <div onClick={onClick} 
            onContextMenu={(e) => {
              e.preventDefault();
              onRightClick(e);
            }}
            className={`border-l-2 select-none`}
            style={{
            borderLeftColor: isActive ? `${folder_accent}` : "transparent"
            }}
            >
            <div  
                  className={`flex items-center gap-2 cursor-pointer text-[#c9c9c9] px-2 py-0.5  transition-all ease-in-out duration-80 
                              ${isActive 
                                    ? 'bg-[#333533] text-white py-px pl-3 rounded-r-lg' 
                                    : 'hover:bg-[#333533] hover:text-white rounded-lg'}`}
                  
                  style={{
                  border: shouldGlow
                        ? `1px solid ${useBrandColor}`
                        : `1px solid transparent`,

                  borderLeft:
                        shouldGlow && isActive
                              ? 'none'
                              : shouldGlow
                              ? `1px solid ${useBrandColor}`
                              : 'none',

                  boxShadow: shouldGlow 
                        ? (
                              isActive
                              ? `
                                    0 -2px 6px ${useBrandColor}80,
                                    5px 0 8px ${useBrandColor}80,
                                    0 2px 6px ${useBrandColor}80
                                    `
                              : `
                                    0 0 10px ${useBrandColor}90
                                    `
                        )
                        : 'none',
                  }}       
                  >

            <div className={`h-1.75 w-1.75 rounded-full shrink-0 shadow-sm`}
                  style={{backgroundColor: folder_accent}}
                  >
                  </div>
                  {
                  isEditing ? (
                        <input className='bg-transparent text-white w-25 focus:outline-none flex-1 text-[12px] font-bold'
                        value={editingName}
                        onChange={(e)=>setEditingName(e.target.value)}
                        autoFocus
                        onBlur={onSaveEdit}
                        onKeyDown={(e)=>{
                              if(e.key==='Enter')
                                    onSaveEdit()
                              if (e.key === 'Escape') {
                                    setEditingFolderId(null);
                                    setEditingName('');
                                    }
                              }}
                        />
                        ) : (
                        <h4 className={`truncate w-25 select-none
                                    ${isActive ? "text-[12px] font-extrabold" : "text-[11px] font-bold"}`}>
                              {name}
                        </h4>

                        )
}
                  <h4 className='text-[#b2b2b2] text-[9px] select-none
                              px- h-3.5 flex items-center  ml-auto font-semibold'>
                              {item}</h4>
        </div>
      </div>

  )
}
