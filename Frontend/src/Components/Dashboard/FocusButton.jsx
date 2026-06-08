import React, { useContext, useEffect } from 'react'
import { useState } from 'react'
import Switch from 'react-switch'
// import { DomainContext } from '../../context/DomainContext'
import { DomainContext } from '../../context/DomainContext'


const FocusButton = ({enabled, onToggle, useBrandColor, setuseBrandColor,}) => {
    const { domain, setDomain } = useContext(DomainContext);
    const isDisabled = domain === "newtab";
    const displayEnabled = enabled && !isDisabled;
    
    useEffect(()=>{
        if (domain !== "Loading..." && domain != "newtab") {
            getColor(domain).then(setuseBrandColor);
        }
    }, [domain, onToggle, setuseBrandColor, enabled]);
    
    
    const rgbToHex = (r, g, b) => {
        const toHex = (c) => c.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };


    const getColor = async (domain) => {
        try {
            const faviconUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=64`;
            const response = await fetch(faviconUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            

            return new Promise((resolve) => {
                reader.onloadend = () => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);

                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                        const colorMap = {};

                        for (let i = 0; i < imageData.length; i += 4) {
                            const r = imageData[i];
                            const g = imageData[i + 1];
                            const b = imageData[i + 2];
                            const a = imageData[i + 3];

                            // Skip transparent or near-transparent pixels
                            if (a < 128) continue;

                            // Skip near-white pixels
                            if (r > 230 && g > 230 && b > 230) continue;

                            // Skip near-black pixels
                            if (r < 25 && g < 25 && b < 25) continue;

                            // Skip low-saturation (gray) pixels using HSL saturation check
                            const max = Math.max(r, g, b);
                            const min = Math.min(r, g, b);
                            const saturation = max === 0 ? 0 : (max - min) / max;
                            if (saturation < 0.15) continue;

                            // Quantize to reduce noise: bucket into 24-step increments
                            const qr = Math.round(r / 24) * 24;
                            const qg = Math.round(g / 24) * 24;
                            const qb = Math.round(b / 24) * 24;

                            const key = `${qr},${qg},${qb}`;
                            colorMap[key] = (colorMap[key] || 0) + 1;
                        }

                        // Pick the most frequent quantized color
                        const dominant = Object.entries(colorMap)
                            .sort((a, b) => b[1] - a[1])[0];

                        if (dominant) {
                            const [qr, qg, qb] = dominant[0].split(',').map(Number);
                            resolve(rgbToHex(
                                Math.min(255, qr),
                                Math.min(255, qg),
                                Math.min(255, qb)
                            ));
                        } else {
                            resolve("#F5F1ED"); // Fallback
                        }
                    };
                    img.src = reader.result;
                };
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            return "#F5F1ED";
        }
    };

  return (
    <label className={`${isDisabled ? 'cursor-not-allowed': 'cursor-pointer'}`} >
        <div onClick={() => {
            if(isDisabled) return
            onToggle()
        }}
                className={`border-2 rounded-lg py-1 px-3 flex items-center gap-1.5 transition-all duration-300 
                        select-none pointer-events-none
                        ${displayEnabled ? 'bg-[#252323]': 'bg-[#333533]'}
                        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none':''}
                    `}
                style={{
                    borderColor: displayEnabled? useBrandColor:'#534B52',
                    boxShadow: displayEnabled? `0 0 7px ${useBrandColor}`: 'none'

                }}
                
                >

        <div className='flex items-center h-4 w-4 justify-center pointer-events-none'>
            {isDisabled ? (<i className="ri-error-warning-line text-white text-lg"></i>) : 
                            <img className='h-4 w-4' src={`https://www.google.com/s2/favicons?sz=64&domain=${domain}`} alt="" />}
            
        </div>

        <div className='mt-0.5 pointer-events-none'>
            <Switch 
                checked={displayEnabled}
                onChange={() => {}}
                checkedIcon={false}       
                uncheckedIcon={false}   
                height={9}
                width={18}    
                handleDiameter={10}
                onColor={useBrandColor}
                offColor='#3E383D'
            ></Switch>
        </div>

        <div className='pointer-events-none'>
            <h4 className='text-[12px] font-semibold ml-0.5'>Focus</h4>
        </div>

    </div>
    </label>
  )
}

export default FocusButton

