"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { api } from "../services/api"

const AccountSettingsPage: React.FC = () => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAccountDetails = async () => {
      setIsLoading(true)
      try {
        const response = await api.get("/account")
        setUsername(response.data.username)
        setEmail(response.data.email)
        setError(null)
      } catch (err: any) {
        setError(err.message || "Failed to fetch account details.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccountDetails()
  }, [])

  const handleUpdateAccount = async () => {
    try {
      await api.put("/account", { username, email })
      alert("Account updated successfully!")
    } catch (err: any) {
      setError(err.message || "Failed to update account.")
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      <h1>Account Settings</h1>
      <div>
        <label>Username:</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div>
        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button onClick={handleUpdateAccount}>Update Account</button>
    </div>
  )
}

export default AccountSettingsPage

