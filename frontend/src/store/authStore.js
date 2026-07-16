import { create } from 'zustand'

function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

// Check if token is still valid (not expired)
function isTokenValid(token) {
  if (!token) return false
  const payload = decodeToken(token)
  if (!payload) return false
  // exp is in seconds, Date.now() is in milliseconds
  const isExpired = payload.exp * 1000 < Date.now()
  return !isExpired
}

// Read from localStorage but validate first
function loadAuth() {
  const token  = localStorage.getItem('token')
  const role   = localStorage.getItem('role')
  const userId = localStorage.getItem('user_id')

  // If token is missing or expired, clear everything
  if (!isTokenValid(token)) {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user_id')
    return { token: null, role: null, userId: null }
  }

  return { token, role, userId }
}
const useAuthStore = create((set) => ({
  ...loadAuth(), // validate on every page load

  login: (token, role, userId) => {
    localStorage.setItem('token',   token)
    localStorage.setItem('role',    role)
    localStorage.setItem('user_id', String(userId))
    set({ token, role, userId: String(userId) })
  },

  logout: () => {
    localStorage.clear()
    set({ token: null, role: null, userId: null })
  },
}))

export default useAuthStore