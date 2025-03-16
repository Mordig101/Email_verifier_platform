import axios from "axios"
import config from "../config"

// Create axios instance with the configured base URL
export const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token")

    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      // Redirect to login page or refresh token
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth API
export const login = (email: string, password: string) => {
  return api.post("/api/login", { email, password })
}

export const logout = () => {
  return api.post("/api/logout")
}

export const getCurrentUser = () => {
  return api.get("/api/user")
}

// Email Verification API
// Update the verifyEmail function to include method parameter
export const verifyEmail = (email: string, method = "auto") => {
  return api.post("/api/verify", { email, method })
}

// Update the verifyBatch function to include method parameter
export const verifyBatch = (emails: string[], method = "auto") => {
  return api.post("/api/verify/batch", { emails, method })
}

export const getVerificationStatus = (taskId: string) => {
  return api.get(`/api/verify/status/${taskId}`)
}

export const getVerificationResults = (taskId: string) => {
  return api.get(`/api/verify/results/${taskId}`)
}

// Statistics API
export const getStatistics = () => {
  return api.get("/api/statistics")
}

export const getVerificationNames = () => {
  return api.get("/api/statistics/verifications")
}

export const getVerificationStatistics = (name: string) => {
  return api.get(`/api/statistics/verifications/${name}`)
}

// Results API
export const getResultsSummary = () => {
  return api.get("/api/results/summary")
}

export const getResultsByCategory = (category: string) => {
  return api.get(`/api/results/${category}`)
}

// Settings API
export const getSettings = () => {
  return api.get("/api/settings")
}

export const updateSettings = (settings: any) => {
  return api.post("/api/settings", settings)
}

export const getBrowsers = () => {
  return api.get("/api/settings/browsers")
}

export const getProxies = () => {
  return api.get("/api/settings/proxies")
}

export const addProxy = (proxy: string) => {
  return api.post("/api/settings/proxies", { proxy })
}

export const getSmtpAccounts = () => {
  return api.get("/api/settings/smtp")
}

export const addSmtpAccount = (account: any) => {
  return api.post("/api/settings/smtp", account)
}

export const getBlacklistedDomains = () => {
  return api.get("/api/domains/blacklist")
}

export const addBlacklistedDomain = (domain: string) => {
  return api.post("/api/domains/blacklist", { domain })
}

export const getWhitelistedDomains = () => {
  return api.get("/api/domains/whitelist")
}

export const addWhitelistedDomain = (domain: string) => {
  return api.post("/api/domains/whitelist", { domain })
}

// History API
export const getEmailHistory = (email: string) => {
  return api.get(`/api/history/${email}`)
}

export const getCategoryHistory = (category: string) => {
  return api.get(`/api/history/category/${category}`)
}

