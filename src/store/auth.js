import { create } from 'zustand'

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('meta_auth') : null
const initial = stored ? JSON.parse(stored) : { token: null, user: null }

const useAuthStore = create((set) => ({
  token: initial.token,
  user: initial.user,
  setAuth: (token, user) => {
    set({ token, user })
    localStorage.setItem('meta_auth', JSON.stringify({ token, user }))
  },
  clear: () => {
    set({ token: null, user: null })
    localStorage.removeItem('meta_auth')
  },
}))

export default useAuthStore
