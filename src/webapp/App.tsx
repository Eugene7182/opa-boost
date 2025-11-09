import { useEffect, useState } from 'react'
import { ready, initData } from './telegram'
import { api, setAuthToken } from './api'

type Region = { id: number; name: string }
type Store = { id: number; name: string }
type SKU = { id: number; code: string; name: string }
type AuthInfo = { ok: boolean; token?: string; error?: string }

export default function App() {
  const [regions, setRegions] = useState<Region[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [sku, setSku] = useState<SKU[]>([])
  const [authToken, setAuthTokenState] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const apiBase =
    (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''
  const storageKey = 'opa-auth-token'

  useEffect(() => {
    ready()

    const ensureAuth = async () => {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setAuthToken(stored)
        setAuthTokenState(stored)
      }

      const data = initData()
      if (!data) return

      try {
        const response = await fetch(`${apiBase}/api/auth/telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ initData: data })
        })
        const auth: AuthInfo = await response.json()
        if (auth?.ok && auth.token) {
          localStorage.setItem(storageKey, auth.token)
          setAuthToken(auth.token)
          setAuthTokenState(auth.token)
          setAuthError(null)
        } else {
          setAuthError(auth?.error || 'Auth failed')
        }
      } catch (error) {
        console.error('Failed to authorize via Telegram initData', error)
        setAuthError('Auth failed')
      }
    }

    ensureAuth()

    Promise.all([
      api.get('/api/refs/regions'),
      api.get('/api/refs/stores'),
      api.get('/api/refs/sku')
    ]).then(([r, s, k]) => {
      setRegions(r)
      setStores(s)
      setSku(k)
    })
  }, [])

  useEffect(() => {
    if (!authToken) return
    api
      .get('/api/me')
      .then((resp) => {
        if (resp?.ok) {
          setUser(resp.user)
        }
      })
      .catch((error) => {
        console.error('Failed to fetch profile', error)
      })
  }, [authToken])

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui' }}>
      <h2>OPA Mini App ✔</h2>
      {authToken ? (
        <p>
          Authenticated as:{' '}
          {user?.tg?.username ? `@${user.tg.username}` : user?.tg?.id || 'unknown'}
        </p>
      ) : (
        <p style={{ color: 'crimson' }}>
          {!authError ? 'Awaiting Telegram authorization…' : `Auth error: ${authError}`}
        </p>
      )}
      <p>
        Regions: {regions.length} | Stores: {stores.length} | SKU: {sku.length}
      </p>
      <p>Это минимальный запуск. Продажи и остатки доступны по API.</p>
    </div>
  )
}
