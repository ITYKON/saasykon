"use client"

import { useEffect } from "react"

export default function SessionKeepAlive() {
  useEffect(() => {
    let stopped = false
    const tick = async () => {
      try {
        await fetch("/api/auth/me", { cache: "no-store" })
        await fetch("/api/auth/refresh", { method: "POST" })
      } catch {}
      if (!stopped) setTimeout(tick, 5 * 60 * 1000)
    }
    tick()
    return () => {
      stopped = true
    }
  }, [])
  return null
}



