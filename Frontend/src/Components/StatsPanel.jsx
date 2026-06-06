import React, { useEffect, useMemo, useRef } from 'react'
import ProgressBar from './ProgressBar'

const StatsPanel = ({accounts, setAccounts, selectedProfile, setSelectedProfile, bookmarks, LogState, setLogState, onvaultOpen, setIsvaultOpen, isvaultOpen}) => {

  const holdTimerRef = useRef(null)

  const handlevaultHoldStart = () => {
    holdTimerRef.current = setTimeout(() => {
      onvaultOpen();
    }, 3000);
  };

  const handlevaultHoldEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const dynamicStats = useMemo(()=>{
    const totalCount = bookmarks.length

    let pcCount = 0;
    let mobileCount = 0;

    const urlMap = {};
    let duplicateCount = 0;
  
    bookmarks.forEach(b => {
      const device = b.device_type?.toLowerCase();
      if(device === 'pc') pcCount++;
      else if (device === 'mobile') mobileCount++;

      const currentUrl = b.url?.trim().toLowerCase();
      if(currentUrl){
        if(urlMap[currentUrl]) {
          duplicateCount++;
        } else {
          urlMap[currentUrl] = true;
        }
      }
    })
    return [
      {
        title: "Total",
        item: String(totalCount),
        color: 'bg-[#5029FA]',
        total: String(totalCount || 1) // Safe fallback to avoid division by zero errors
      },
      {
        title: "PC",
        item: String(pcCount),
        color: 'bg-[#957FEF]',
        total: String(totalCount || 1)
      },
      {
        title: "Mobile",
        item: String(mobileCount),
        color: 'bg-[#957FEF]',
        total: String(totalCount || 1)
      },
      {
        title: "Duplicates",
        item: String(duplicateCount),
        color: 'bg-[#957FEF]',
        total: String(totalCount || 1)
      },
    ];
  }, [bookmarks])

  useEffect(() => {
    // console.log(accounts)
    // console.log(selectedProfile)

  }, [selectedProfile])
  

  return (
    <div className='bg-[#333533] w-full h-33 border border-[#534B52] rounded-lg mt-auto shrink-0 p-2'
          onMouseDown={handlevaultHoldStart}
          onMouseUp={handlevaultHoldEnd}
          onMouseLeave={handlevaultHoldEnd}
          onClick={()=>{
            if (isvaultOpen){
              setIsvaultOpen(false)
              chrome.storage.session.remove('vaultOpen')
            }
          }}
          >
      <div className='flex flex-col text-[10.5px] '>
        {dynamicStats.map((data, idx) =>(
        <div key={idx}>
          <div className='flex justify-between'>
            <h4 className='text-[#b2b2b2] font-semibold'>{data.title}</h4>
            <h4 className={`font-medium ${idx === dynamicStats.length - 1 ? 'text-[#ff2222]' : 'text-white'}`}>
                {data.item}
              </h4>
          </div >
          {idx !== dynamicStats.length - 1 &&(
              <ProgressBar 
                color={data.color} 
                value={data.item} 
                total={data.total}/>
                )}
          </div>
          ))}
      </div>
      <div className='w-full h-px mt-1.75 bg-[#6c757d] mb-1'></div>
      <div className='flex justify-between'>
        <h4 className='text-[#b2b2b2] text-[11px]'>
              {accounts?.find(acc => String(acc.id) === String(selectedProfile))?.username || 'No UserName'}</h4>
        <button className='text-[10px] border-transparent cursor-pointer bg-[#ff292e] text-white px-1 py-0.5 rounded-sm text-center 
                            font-bold active:scale-95 transition ease-in-out duration-100
                            hover:bg-[#c10505]'
                            // onClick={async () => { await chrome.storage.session.remove('selectedProfile')
                            //                         setSelectedProfile(null)}}
                            //                         >Logout</button>
                            onClick={() => {setLogState('logging_out')}}
                                                    >Logout</button>
      </div>
    </div>
  )
}

export default StatsPanel