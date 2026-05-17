import { cache } from 'react'
import { createClient } from './supabase/server'

/**
 * Cached user fetcher — deduplicates auth.getUser() calls within the same
 * React render tree / request. If AppShell AND the page both call this,
 * only ONE Supabase round-trip happens.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
