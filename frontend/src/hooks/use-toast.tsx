"use client"

import { useState } from "react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = ({ title, description, type = "info", duration = 5000 }: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, title, description, type, duration }

    setToasts((prevToasts) => [...prevToasts, newToast])

    if (duration !== Number.POSITIVE_INFINITY) {
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
      }, duration)
    }

    return id
  }

  const dismiss = (id?: string) => {
    setToasts((prevToasts) => (id ? prevToasts.filter((toast) => toast.id !== id) : []))
  }

  return {
    toast,
    dismiss,
    toasts,
  }
}

