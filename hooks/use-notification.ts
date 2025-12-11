"use client"

import { useCallback } from "react"
import { type ToastActionElement } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

type NotificationVariant = 'success' | 'error' | 'warning' | 'info'

type NotificationOptions = {
  title?: string
  description?: string
  action?: ToastActionElement
  duration?: number
}

export function useNotification() {
  const { toast } = useToast()

  const notify = useCallback((variant: NotificationVariant, options: NotificationOptions) => {
    const { title, description, action, duration = 5000 } = options
    
    const baseClasses = {
      success: { variant: 'default' as const, className: 'bg-green-50 border-green-200 text-green-800' },
      error: { variant: 'destructive' as const, className: '' },
      warning: { variant: 'default' as const, className: 'bg-amber-50 border-amber-200 text-amber-800' },
      info: { variant: 'default' as const, className: 'bg-blue-50 border-blue-200 text-blue-800' },
    }

    return toast({
      title,
      description,
      action,
      duration,
      ...baseClasses[variant],
      className: `border ${baseClasses[variant].className} shadow-lg`,
    })
  }, [toast])

  const success = useCallback(
    (options: Omit<NotificationOptions, 'variant'>) => 
      notify('success', { ...options, title: options.title || 'Succès' }),
    [notify]
  )

  const error = useCallback(
    (options: Omit<NotificationOptions, 'variant'>) => 
      notify('error', { ...options, title: options.title || 'Erreur' }),
    [notify]
  )

  const warning = useCallback(
    (options: Omit<NotificationOptions, 'variant'>) => 
      notify('warning', { ...options, title: options.title || 'Attention' }),
    [notify]
  )

  const info = useCallback(
    (options: Omit<NotificationOptions, 'variant'>) => 
      notify('info', { ...options, title: options.title || 'Information' }),
    [notify]
  )

  return {
    success,
    error,
    warning,
    info,
  }
}
