// Access/refresh tokenlar brauzer localStorage'ida saqlanadi (SPA rejimi)
const ACCESS_KEY = 'ctf_access_token'
const REFRESH_KEY = 'ctf_refresh_token'

export const tokenStorage = {
  get access() {
    return import.meta.client ? localStorage.getItem(ACCESS_KEY) : null
  },
  get refresh() {
    return import.meta.client ? localStorage.getItem(REFRESH_KEY) : null
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
