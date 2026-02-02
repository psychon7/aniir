import { useState, useCallback, useEffect } from 'react'

interface User {
  id: number
  email: string
  name: string
  role?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  })

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('access_token')
    if (token) {
      // In a real app, validate token and fetch user
      setState({
        user: { id: 1, email: 'user@example.com', name: 'User' },
        isAuthenticated: true,
        isLoading: false,
        token,
      })
    } else {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
      })
    }
  }, [])

  const login = useCallback(async (email: string, _password: string) => {
    // Implement login logic
    const token = 'mock-token'
    localStorage.setItem('access_token', token)
    setState({
      user: { id: 1, email, name: 'User' },
      isAuthenticated: true,
      isLoading: false,
      token,
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
    })
  }, [])

  return {
    ...state,
    login,
    logout,
  }
}

export default useAuth
