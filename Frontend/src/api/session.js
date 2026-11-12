const TOKEN_KEY = 'tagmindAccessToken'
const REFRESH_KEY = 'tagmindRefreshToken'
const VAULT_TOKEN_KEY = 'tagmindVaultToken'
const VAULT_EXPIRY_KEY = 'tagmindVaultTokenExpiresAt'
const SELECTED_PROFILE_KEY = 'selectedProfile'
const CACHED_PROFILES_KEY = 'tagmindCachedProfiles'
const VAULT_SESSION_MILLISECONDS = 14 * 60 * 1000
let refreshInProgress = null

async function getStoredValue(key) {
  if (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.storage?.session) {
    const result = await globalThis.chrome.storage.session.get(key)
    return result[key] || null
  }
  return window.sessionStorage?.getItem(key) || null
}

async function setStoredValue(key, value) {
  if (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.storage?.session) {
    if (value) await globalThis.chrome.storage.session.set({ [key]: value })
    else await globalThis.chrome.storage.session.remove(key)
    return
  }
  if (value) window.sessionStorage?.setItem(key, value)
  else window.sessionStorage?.removeItem(key)
}

// Account authentication and profile selection should survive extension and
// backend restarts. Vault unlock state intentionally remains session-only.
async function getPersistentValue(key) {
  if (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.storage?.local) {
    const result = await globalThis.chrome.storage.local.get(key)
    if (result[key]) return result[key]

    // Migrate values written by earlier versions that used session storage.
    if (globalThis.chrome.storage.session) {
      const previous = await globalThis.chrome.storage.session.get(key)
      if (previous[key]) {
        await globalThis.chrome.storage.local.set({ [key]: previous[key] })
        await globalThis.chrome.storage.session.remove(key)
        return previous[key]
      }
    }
    return null
  }
  return window.localStorage?.getItem(key) || null
}

async function setPersistentValue(key, value) {
  if (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.storage?.local) {
    if (value !== null && value !== undefined) {
      await globalThis.chrome.storage.local.set({ [key]: value })
    } else {
      await globalThis.chrome.storage.local.remove(key)
    }
    if (globalThis.chrome.storage.session) {
      await globalThis.chrome.storage.session.remove(key)
    }
    return
  }
  if (value !== null && value !== undefined) window.localStorage?.setItem(key, value)
  else window.localStorage?.removeItem(key)
}

export async function getAccessToken() {
  return getPersistentValue(TOKEN_KEY)
}

function getTokenExpiry(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return 0
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const normalized = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=')
    const decoded = JSON.parse(atob(normalized))
    return Number(decoded.exp) || 0
  } catch {
    return 0
  }
}

export async function setAccessToken(token) {
  await setPersistentValue(TOKEN_KEY, token)
  await setPersistentValue(REFRESH_KEY, null)
}

export async function setAuthTokens(accessToken, refreshToken) {
  await setPersistentValue(TOKEN_KEY, accessToken)
  await setPersistentValue(REFRESH_KEY, refreshToken)
}

export async function getSelectedProfile() {
  return getPersistentValue(SELECTED_PROFILE_KEY)
}

export async function setSelectedProfile(profileId) {
  return setPersistentValue(SELECTED_PROFILE_KEY, profileId)
}

export async function clearSelectedProfile() {
  return setPersistentValue(SELECTED_PROFILE_KEY, null)
}

export async function getCachedProfiles() {
  const profiles = await getPersistentValue(CACHED_PROFILES_KEY)
  if (Array.isArray(profiles)) return profiles
  try {
    return JSON.parse(profiles || '[]')
  } catch {
    return []
  }
}

export async function setCachedProfiles(profiles) {
  return setPersistentValue(CACHED_PROFILES_KEY, JSON.stringify(profiles))
}

export async function getVaultToken() {
  const token = await getStoredValue(VAULT_TOKEN_KEY)
  const expiry = Number(await getStoredValue(VAULT_EXPIRY_KEY))
  if (!token || !expiry || Date.now() >= expiry) {
    await clearVaultToken()
    return null
  }
  return token
}

export async function setVaultToken(token) {
  await setStoredValue(VAULT_TOKEN_KEY, token)
  await setStoredValue(
    VAULT_EXPIRY_KEY,
    String(Date.now() + VAULT_SESSION_MILLISECONDS),
  )
}

export async function getVaultTokenExpiry() {
  return Number(await getStoredValue(VAULT_EXPIRY_KEY)) || 0
}

export async function clearVaultToken() {
  await Promise.all([
    setStoredValue(VAULT_TOKEN_KEY, null),
    setStoredValue(VAULT_EXPIRY_KEY, null),
  ])
}

export async function clearAccessToken() {
  await Promise.all([
    setPersistentValue(TOKEN_KEY, null),
    setPersistentValue(REFRESH_KEY, null),
    clearVaultToken(),
  ])
}

export async function refreshAccessToken() {
  if (!refreshInProgress) {
    refreshInProgress = (async () => {
      const refresh = await getPersistentValue(REFRESH_KEY)
      if (!refresh) return null

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}accounts/token/refresh/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
          },
        )
        if (!response.ok) {
          await clearAccessToken()
          return null
        }
        const data = await response.json()
        await setPersistentValue(TOKEN_KEY, data.access)
        return data.access
      } catch {
        return null
      }
    })().finally(() => {
      refreshInProgress = null
    })
  }
  return refreshInProgress
}

async function getUsableAccessToken() {
  const token = await getAccessToken()
  const expiresAt = getTokenExpiry(token || '')
  // Refresh shortly before expiry so popup startup does not issue requests
  // with a token that expires while the API calls are in flight.
  if (!token || !expiresAt || expiresAt <= Math.floor(Date.now() / 1000) + 30) {
    return (await refreshAccessToken()) || token
  }
  return token
}

export async function authenticatedFetch(url, options = {}) {
  const send = async token => {
    const headers = new Headers(options.headers || {})
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const vaultToken = await getVaultToken()
    if (vaultToken) headers.set('X-Vault-Token', vaultToken)
    return fetch(url, { ...options, headers })
  }

  let response = await send(await getUsableAccessToken())
  if (response.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) response = await send(refreshed)
  }
  return response
}

export async function installAxiosAuthentication(axios) {
  axios.interceptors.request.use(async config => {
    const token = await getUsableAccessToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    const vaultToken = await getVaultToken()
    if (vaultToken) {
      config.headers = config.headers || {}
      config.headers['X-Vault-Token'] = vaultToken
    }
    return config
  })

  axios.interceptors.response.use(
    response => response,
    async error => {
      const config = error.config
      if (error.response?.status !== 401 || !config || config._tagmindRetried) {
        throw error
      }
      config._tagmindRetried = true
      const refreshed = await refreshAccessToken()
      if (!refreshed) throw error
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${refreshed}`
      return axios(config)
    },
  )
}
