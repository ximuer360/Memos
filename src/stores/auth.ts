import { ref } from 'vue'

const TOKEN_KEY = 'admin_token'

export const useAuthStore = () => {
  const token = ref(localStorage.getItem(TOKEN_KEY))
  const isAuthenticated = ref(!!token.value)

  const login = async (username: string, password: string) => {
    try {
      console.log('Attempting login with:', { username, password })
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()
      console.log('Server response:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed')
      }

      token.value = data.token
      localStorage.setItem(TOKEN_KEY, data.token)
      isAuthenticated.value = true
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Login failed')
    }
  }

  const logout = () => {
    token.value = null
    localStorage.removeItem(TOKEN_KEY)
    isAuthenticated.value = false
  }

  return {
    token,
    isAuthenticated,
    login,
    logout
  }
} 