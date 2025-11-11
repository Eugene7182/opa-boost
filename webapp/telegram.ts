declare global {
  interface Window {
    Telegram: any
  }
}

export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
export const ready = () => {
  tg?.expand()
  tg?.ready()
}
export const initData = () => tg?.initData || ''
