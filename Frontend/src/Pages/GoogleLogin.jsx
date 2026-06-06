import { useEffect } from 'react'

export default function GoogleLogin(){

    useEffect(()=>{

        const script = document.createElement('script')

        script.src =
            'https://accounts.google.com/gsi/client'

        script.async = true

        script.defer = true

        script.onload = ()=>{

            console.log(
                'Google GIS Loaded'
            )
        }

        script.onerror = ()=>{

            console.log(
                'Google GIS Failed'
            )
        }

        document.body.appendChild(script)

    },[])

    return(
        <div className="text-white">
            Google Login Test
        </div>
    )
}