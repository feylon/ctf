import type { LoginResponse, Me } from '~/types/api'

export function useAuth() {
  const api = useApi()
  const user = useState<Me | null>('auth:user', () => null)
  const ready = useState<boolean>('auth:ready', () => false)

  const loggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  // Admin yoki moderator: admin paneliga kira oladi
  const isStaff = computed(() => user.value?.role === 'admin' || user.value?.role === 'moderator')

  async function fetchMe() {
    user.value = await api.get<Me>('/auth/me')
    return user.value
  }

  async function init() {
    if (ready.value) return
    if (tokenStorage.access) {
      try {
        await fetchMe()
      }
      catch {
        tokenStorage.clear()
        user.value = null
      }
    }
    ready.value = true
  }

  async function login(username: string, password: string) {
    const res = await api.post<LoginResponse>('/auth/login', { username, password }, { auth: false })
    tokenStorage.set(res.access_token, res.refresh_token)
    return await fetchMe()
  }

  async function logout(redirect = true) {
    try {
      if (tokenStorage.access) await api.post('/auth/logout')
    }
    catch {
      // Token allaqachon yaroqsiz bo'lsa ham lokal sessiya tozalanadi
    }
    tokenStorage.clear()
    user.value = null
    if (redirect) await navigateTo('/login')
  }

  return { user, ready, loggedIn, isAdmin, isStaff, init, fetchMe, login, logout }
}
