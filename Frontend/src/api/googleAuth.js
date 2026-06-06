export async function googleLogin(token){
    const response = await fetch(

        `${import.meta.env.VITE_API_BASE_URL}accounts/google-login/`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token
            })
        }
    )

    const data = await response.json()
    if(!response.ok){
        throw new Error(
            data.message ||
            'Google Login Failed'
        )
    }
    return data
}