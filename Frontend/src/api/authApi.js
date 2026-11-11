export async function registerUser(
    username,
    email,
    password
){

    const response = await fetch(

        `${import.meta.env.VITE_API_BASE_URL}accounts/register/`,

        {

            method:'POST',

            headers:{
                'Content-Type':'application/json'
            },

            body:JSON.stringify({

                username,
                email,
                password

            })
        }
    )

    const data =
        await response.json()

    if(!response.ok){

        throw new Error(

            data.password?.[0] ||

            data.username?.[0] ||

            data.email?.[0] ||

            data.detail ||

            'Registration Failed'
        )
    }

    return data
}

export async function loginUser(email, password) {
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}accounts/login/`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        }
    )
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.message || 'Login failed')
    }
    return data
}
