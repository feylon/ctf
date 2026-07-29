import type { AuthTokens } from '~/types/api'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: BodyInit | Record<string, unknown> | null
  query?: Record<string, unknown>
  headers?: Record<string, string>
  // false bo'lsa Authorization header qo'shilmaydi
  auth?: boolean
}

// Bir vaqtda kelgan 401 javoblar uchun bitta refresh so'rovi ishlatiladi
let refreshing: Promise<boolean> | null = null

async function refreshTokens(baseURL: string): Promise<boolean> {
  const refreshToken = tokenStorage.refresh
  if (!refreshToken) return false

  refreshing ??= $fetch<AuthTokens>('/auth/refresh', {
    baseURL,
    method: 'POST',
    body: { refresh_token: refreshToken },
  })
    .then((tokens) => {
      tokenStorage.set(tokens.access_token, tokens.refresh_token)
      return true
    })
    .catch(() => {
      tokenStorage.clear()
      return false
    })
    .finally(() => {
      refreshing = null
    })

  return refreshing
}

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string

  async function request<T>(url: string, options: RequestOptions = {}, retried = false): Promise<T> {
    const { auth = true, headers, ...rest } = options
    const token = auth ? tokenStorage.access : null

    try {
      return await $fetch<T>(url, {
        baseURL,
        ...rest,
        headers: {
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
    }
    catch (error) {
      const status = (error as { statusCode?: number }).statusCode
      if (status === 401 && token && !retried) {
        if (await refreshTokens(baseURL)) {
          return request<T>(url, options, true)
        }
        // Sessiya tugagan: foydalanuvchini chiqarib, login sahifasiga yo'naltiramiz
        useState('auth:user').value = null
        const route = useRoute()
        if (route.path !== '/login') {
          await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
        }
      }
      throw error
    }
  }

  return {
    baseURL,
    request,
    get: <T>(url: string, query?: Record<string, unknown>, options?: RequestOptions) =>
      request<T>(url, { ...options, method: 'GET', query }),
    post: <T>(url: string, body?: RequestOptions['body'], options?: RequestOptions) =>
      request<T>(url, { ...options, method: 'POST', body }),
    patch: <T>(url: string, body?: RequestOptions['body'], options?: RequestOptions) =>
      request<T>(url, { ...options, method: 'PATCH', body }),
    put: <T>(url: string, body?: RequestOptions['body'], options?: RequestOptions) =>
      request<T>(url, { ...options, method: 'PUT', body }),
    del: <T>(url: string, options?: RequestOptions) =>
      request<T>(url, { ...options, method: 'DELETE' }),
  }
}

// Backend serveri manzili (yuklangan fayllar uchun): http://host:3000
export function useServerOrigin() {
  const config = useRuntimeConfig()
  return (config.public.apiBase as string).replace(/\/api\/v1\/?$/, '')
}

export function fileUrl(path?: string | null) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${useServerOrigin()}${path.startsWith('/') ? '' : '/'}${path}`
}
