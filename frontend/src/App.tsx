"use client"

import type React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ChakraProvider, extendTheme } from "@chakra-ui/react"
import { AuthProvider, useAuth } from "./contexts/AuthContext"

// Pages
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import UserDashboard from "./pages/UserDashboard"
import AdminDashboard from "./pages/AdminDashboard"
import VerificationPage from "./pages/VerificationPage"
import StatisticsPage from "./pages/StatisticsPage"
import ApiPage from "./pages/ApiPage"
import AccountSettingsPage from "./pages/AccountSettingsPage"

// Protected route component
const ProtectedRoute = ({
  children,
  requiredRole = null,
}: { children: React.ReactNode; requiredRole?: string | null }) => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" />
  }

  return <>{children}</>
}

// Theme
const theme = extendTheme({
  colors: {
    brand: {
      50: "#e6f7ff",
      100: "#b3e0ff",
      200: "#80caff",
      300: "#4db3ff",
      400: "#1a9dff",
      500: "#0080ff",
      600: "#0066cc",
      700: "#004d99",
      800: "#003366",
      900: "#001a33",
    },
  },
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
  },
})

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* User routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/verification"
              element={
                <ProtectedRoute>
                  <VerificationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistics"
              element={
                <ProtectedRoute>
                  <StatisticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/api"
              element={
                <ProtectedRoute>
                  <ApiPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AccountSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  )
}

export default App

