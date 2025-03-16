"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { api } from "../services/api"
import config from "../config"

interface User {
  email: string
  name: string
  role: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  defaultCredentials: {
    admin: { email: string; password: string }
    user: { email: string; password: string }
  }
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  defaultCredentials: config.defaultCredentials,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))

      // Set token in API headers
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log(`Attempting to login with ${email} to ${api.defaults.baseURL}`)
      const response = await api.post("/api/login", { email, password })
      const { access_token, user } = response.data

      localStorage.setItem("token", access_token)
      localStorage.setItem("user", JSON.stringify(user))

      // Set token in API headers
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`

      setIsAuthenticated(true)
      setUser(user)
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    try {
      console.log(`Attempting to signup with ${email} to ${api.defaults.baseURL}`)
      const response = await api.post("/api/signup", { name, email, password })
      const { access_token, user } = response.data

      localStorage.setItem("token", access_token)
      localStorage.setItem("user", JSON.stringify(user))

      // Set token in API headers
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`

      setIsAuthenticated(true)
      setUser(user)
    } catch (error) {
      console.error("Signup failed:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")

    // Remove token from API headers
    delete api.defaults.headers.common["Authorization"]

    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        signup,
        logout,
        defaultCredentials: config.defaultCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

