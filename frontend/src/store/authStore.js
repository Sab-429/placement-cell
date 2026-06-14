import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token:  localStorage.getItem('token')   || null,
  role:   localStorage.getItem('role')    || null,
  userId: localStorage.getItem('user_id') || null,

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