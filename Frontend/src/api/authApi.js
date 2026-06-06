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

            data.email?.[0] ||

            'Registration Failed'
        )
    }

    return data
}