import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'
type BusinessTheme = 'default' | 'led' | 'domotics' | 'hvac' | 'waveconcept' | 'accessories'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  businessTheme: BusinessTheme
  linkedBusinessUnitId?: number
  linkedBusinessUnitLabel?: string
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setBusinessTheme: (businessTheme: BusinessTheme) => void
  setBusinessUnitTheme: (businessUnitId?: number, businessUnitLabel?: string) => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return getSystemTheme()
  return theme
}

function resolveBusinessThemeFromLabel(label?: string): BusinessTheme {
  const value = (label || '').toLowerCase()
  if (!value) return 'default'
  if (value.includes('led')) return 'led'
  if (value.includes('domotic')) return 'domotics'
  if (value.includes('hvac')) return 'hvac'
  if (value.includes('wave')) return 'waveconcept'
  if (value.includes('access')) return 'accessories'
  return 'default'
}

function applyTheme(resolvedTheme: 'light' | 'dark', businessTheme: BusinessTheme) {
  const root = document.documentElement

  root.classList.add('theme-transition')

  if (resolvedTheme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  root.classList.remove(
    'theme-bu-led',
    'theme-bu-domotics',
    'theme-bu-hvac',
    'theme-bu-waveconcept',
    'theme-bu-accessories'
  )
  if (businessTheme !== 'default') {
    root.classList.add(`theme-bu-${businessTheme}`)
  }

  setTimeout(() => {
    root.classList.remove('theme-transition')
  }, 300)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),
      businessTheme: 'default',
      linkedBusinessUnitId: undefined,
      linkedBusinessUnitLabel: undefined,

      setTheme: (theme) => {
        const resolvedTheme = resolveTheme(theme)
        const businessTheme = get().businessTheme
        applyTheme(resolvedTheme, businessTheme)
        set({ theme, resolvedTheme })
      },

      toggleTheme: () => {
        const { theme, businessTheme } = get()
        const newTheme =
          theme === 'dark'
            ? 'light'
            : theme === 'light'
              ? 'dark'
              : getSystemTheme() === 'dark'
                ? 'light'
                : 'dark'
        const resolvedTheme = resolveTheme(newTheme)
        applyTheme(resolvedTheme, businessTheme)
        set({ theme: newTheme, resolvedTheme })
      },

      setBusinessTheme: (businessTheme) => {
        const resolvedTheme = resolveTheme(get().theme)
        applyTheme(resolvedTheme, businessTheme)
        set({ businessTheme })
      },

      setBusinessUnitTheme: (businessUnitId, businessUnitLabel) => {
        const businessTheme = resolveBusinessThemeFromLabel(businessUnitLabel)
        const resolvedTheme = resolveTheme(get().theme)
        applyTheme(resolvedTheme, businessTheme)
        set({
          businessTheme,
          linkedBusinessUnitId: businessUnitId,
          linkedBusinessUnitLabel: businessUnitLabel,
        })
      },
    }),
    {
      name: 'erp-theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolvedTheme = resolveTheme(state.theme)
          const businessTheme = state.businessTheme || 'default'
          applyTheme(resolvedTheme, businessTheme)
          state.resolvedTheme = resolvedTheme
          state.businessTheme = businessTheme
        }
      },
    }
  )
)

if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    const state = useThemeStore.getState()
    if (state.theme === 'system') {
      const resolvedTheme = getSystemTheme()
      applyTheme(resolvedTheme, state.businessTheme)
      useThemeStore.setState({ resolvedTheme })
    }
  })
}
