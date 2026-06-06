import { useEffect, useState } from "react";

export const useChromeStorage = (key, defaultValue) => {
    const [state, setState] = useState(defaultValue);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        if (typeof chrome!== "undefined" && chrome.storage && chrome.storage.local){
            chrome.storage.local.get([key], (result) =>{
                if (result[key] !== undefined){
                    setState(result[key]);
                }
                setLoading(false)
            });
        }else{
            console.warn("Chrome Storage not found, using default state.")
            setLoading(false)
        }
    },[key]);

    useEffect(()=>{
        if (!loading && typeof chrome!='undefined' && chrome.storage && chrome.storage.local){
            chrome.storage.local.set({[key]: state});
        }
    },[key, state, loading]); 

  return [state, setState, loading];
  
}


// import {useEffect,useState} from 'react'

export function useSessionAuth(){

    const [isAuthenticated,setIsAuthenticated]
    = useState(false)

    useEffect(()=>{

        chrome.storage.session.get(
            ['authenticated'],
            (result)=>{

                setIsAuthenticated(
                    result.authenticated || false
                )

            }
        )

    },[])

    return {
        isAuthenticated,
        setIsAuthenticated
    }
}