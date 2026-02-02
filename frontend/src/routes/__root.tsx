import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ToastContainer } from '@/components/ui/feedback/Toast'
import { useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'

function RootComponent() {
  // Initialize theme on mount
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    // Theme is initialized automatically by the store's onRehydrateStorage
    // This effect ensures the store is accessed and hydrated
  }, [theme])

  return (
    <>
      <Outlet />
      <ToastContainer />
      <TanStackRouterDevtools />
    </>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
