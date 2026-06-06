export async function setVaultPassword(profile_id, password){

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}accounts/set-vault-password/`,

        {
            method: 'POST',
            headers: {
                'Content-Type':
                    'application/json'
            },

            body: JSON.stringify({
                profile_id,
                password
            })
        }
    )

    const data = await response.json()

    if(!response.ok){
        throw new Error(data.message || 'Failed to create vault')
    }

    return data
}


export async function unlockVault(profile_id, password){

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}accounts/unlock-vault/`,

        {
            method: 'POST',
            headers: {
                'Content-Type':
                    'application/json'
            },

            body: JSON.stringify({
                profile_id,
                password
            })
        }
    )

    const data = await response.json()

    if(!response.ok){
        throw new Error(data.message || 'Failed to unlock vault')
    }
    return data
}


export async function changeVaultPassword(profile_id, old_password, new_password){

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}accounts/change-vault-password/`,

        {
            method: 'POST',
            headers: {
                'Content-Type':
                    'application/json'
            },
            body: JSON.stringify({
                profile_id,
                old_password,
                new_password
            })
        }
    )

    const data = await response.json()

    if(!response.ok){throw new Error(data.message || 'Failed to change password')
    }

    return data
}