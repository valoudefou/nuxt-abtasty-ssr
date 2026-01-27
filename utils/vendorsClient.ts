const DEFAULT_VENDOR_ID = ''
const VENDOR_COOKIE = 'abt_vendor'
const VENDOR_STORAGE_KEY = 'abt_vendor'

const readCookie = (name: string) => {
  if (!import.meta.client || !document?.cookie) {
    return ''
  }

  const prefix = `${name}=`
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length))
    }
  }
  return ''
}

export const getSelectedVendorClient = () => {
  const cookieValue = readCookie(VENDOR_COOKIE).trim()
  if (cookieValue) {
    return cookieValue
  }

  if (import.meta.client) {
    const stored = localStorage.getItem(VENDOR_STORAGE_KEY)?.trim()
    if (stored) {
      return stored
    }
  }

  return ''
}

export const VENDOR_STORAGE = VENDOR_STORAGE_KEY
export const DEFAULT_VENDOR_CLIENT = DEFAULT_VENDOR_ID
