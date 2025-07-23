"use client"

import { useState, useCallback, useEffect } from "react"

type ToastType = "default" | "success" | "error" | "warning" | "info"

interface ToastProps {
  title: string
  description?: string
  type?: ToastType
  duration?: number
}

interface Toast extends ToastProps {
  id: string
  createdAt: Date
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(
    ({ title, description, type = "default", duration = 5000 }: ToastProps) => {
      const id = Math.random().toString(36).slice(2, 9)
      const newToast: Toast = {
        id,
        title,
        description,
        type,
        duration,
        createdAt: new Date(),
      }

      setToasts((prevToasts) => [...prevToasts, newToast])

      return id
    },
    []
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  // Auto-dismiss toasts after their duration
  useEffect(() => {
    if (toasts.length === 0) return

    const timers = toasts.map((toast) => {
      return setTimeout(() => {
        dismiss(toast.id)
      }, toast.duration)
    })

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [toasts, dismiss])

  // Render the toasts in a portal
  useEffect(() => {
    let toastContainer = document.getElementById("toast-container")

    if (!toastContainer) {
      toastContainer = document.createElement("div")
      toastContainer.id = "toast-container"
      toastContainer.className = "fixed top-4 right-4 z-50 flex flex-col items-end space-y-2"
      document.body.appendChild(toastContainer)
    }

    const renderToast = (toast: Toast) => {
      const toastElement = document.createElement("div")
      toastElement.id = `toast-${toast.id}`
      toastElement.className = `
        bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
        px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
        flex flex-col max-w-sm w-full transform transition-all duration-300 ease-in-out
        ${toast.type === "success" ? "border-l-4 border-l-green-500" : ""}
        ${toast.type === "error" ? "border-l-4 border-l-red-500" : ""}
        ${toast.type === "warning" ? "border-l-4 border-l-yellow-500" : ""}
        ${toast.type === "info" ? "border-l-4 border-l-blue-500" : ""}
      `
      
      const titleElement = document.createElement("div")
      titleElement.className = "font-medium"
      titleElement.textContent = toast.title
      
      toastElement.appendChild(titleElement)
      
      if (toast.description) {
        const descElement = document.createElement("div")
        descElement.className = "text-sm text-gray-500 dark:text-gray-400"
        descElement.textContent = toast.description
        toastElement.appendChild(descElement)
      }
      
      const closeButton = document.createElement("button")
      closeButton.className = "absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      closeButton.textContent = "×"
      closeButton.onclick = () => dismiss(toast.id)
      
      toastElement.appendChild(closeButton)
      toastContainer?.appendChild(toastElement)
      
      // Animate in
      setTimeout(() => {
        toastElement.classList.add("opacity-100", "translate-y-0")
      }, 10)
      
      // Track when this toast should be removed
      setTimeout(() => {
        if (toastElement && toastElement.parentNode === toastContainer) {
          toastElement.classList.add("opacity-0", "-translate-y-2")
          setTimeout(() => {
            if (toastElement && toastElement.parentNode === toastContainer) {
              toastContainer?.removeChild(toastElement)
            }
          }, 300)
        }
      }, toast.duration)
    }
    
    // Render new toasts
    toasts.forEach(renderToast)
    
    return () => {
      // Clean up on unmount (though this is rare for a hook)
      if (toastContainer && toastContainer.parentNode === document.body) {
        document.body.removeChild(toastContainer)
      }
    }
  }, [toasts, dismiss])

  return { toast, dismiss }
}