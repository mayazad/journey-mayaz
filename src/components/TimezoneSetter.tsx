'use client'
import { useEffect } from 'react'

/**
 * Sets the user's timezone as a cookie so server-side AI briefings
 * can use the correct local time slot (morning/afternoon).
 * Must be a Client Component to access Intl in the browser.
 */
export function TimezoneSetter() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) {
        document.cookie = `user-timezone=${encodeURIComponent(tz)}; path=/; max-age=31536000; SameSite=Lax`
      }
    } catch (_) {}
  }, [])
  return null
}
