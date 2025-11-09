const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''
const withBase = (u: string) => (baseUrl ? `${baseUrl}${u}` : u)

let authToken: string | null = null
export const setAuthToken = (token: string | null) => {
  authToken = token
}

const buildHeaders = (headers?: HeadersInit) => {
  const next = new Headers(headers || {})
  if (authToken) {
    next.set('Authorization', `Bearer ${authToken}`)
  }
  return next
}

const request = async (u: string, init: RequestInit = {}) => {
  const response = await fetch(withBase(u), {
    credentials: 'include',
    ...init,
    headers: buildHeaders(init.headers)
  })
  return response.json()
}

export const api = {
  get: (u: string) => request(u),
  post: (u: string, b: any) =>
    request(u, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b)
    })
}
