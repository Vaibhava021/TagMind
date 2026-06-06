import { useGoogleLogin } from '@react-oauth/google'

export function useGoogleAuth(onSuccess){

    return useGoogleLogin({
        flow: 'implicit',onSuccess,
        onError: (err)=>{console.error('Google Login Error', err)}
    })
}