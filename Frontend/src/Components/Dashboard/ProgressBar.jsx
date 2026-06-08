import React from 'react'

const ProgressBar = (props) => {
    const percent = (props.value / props.total) * 100;
  return (
        <div className='w-full h-0.5 bg-[#252323] rounded-full overflow-hidden mt-0.5 mb-1'>
            <div className={`h-full ${props.color}`}
                 style={{ width: `${percent}%` }}>
            </div>
          </div>
  )
}

export default ProgressBar