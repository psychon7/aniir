import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserInfo } from '@/types/auth'

// Dev bypass user - used when backend is unavailable
export const DEV_USER: UserInfo = {
  id: 1,
  username: 'dev',
  firstName: 'Dev',
  lastName: 'User',
  email: 'dev@ecoled-europe.com',
  roleId: 1,
  roleName: 'Admin',
  societyId: 1,
  societyName: 'ECOLED EUROPE',
  isAdmin: true,
  photoPath: null,
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: UserInfo | null
  isAuthenticated: boolean
  isDevMode: boolean
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: UserInfo) => void
  devLogin: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isDevMode: false,

      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isDevMode: false,
        }),

      setUser: (user) =>
        set({
          user,
        }),

      devLogin: () =>
        set({
          accessToken: 'dev-token',
          refreshToken: 'dev-refresh-token',
          user: DEV_USER,
          isAuthenticated: true,
          isDevMode: true,
        }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isDevMode: false,
        }),
    }),
    {
      name: 'erp-auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isDevMode: state.isDevMode,
      }),
    }
  )
)
