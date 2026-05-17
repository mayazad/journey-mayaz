'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/* ──────────────────────────────────────────────────────
   Helper — verify caller is admin, return their user id
────────────────────────────────────────────────────── */
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('Not authorized')
  return { supabase, userId: user.id }
}

/* ──────────────────────────────────────────────────────
   Get all pending users (admin only)
────────────────────────────────────────────────────── */
export async function getPendingUsers() {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return []
  return data ?? []
}

/* ──────────────────────────────────────────────────────
   Approve a user (admin only)
────────────────────────────────────────────────────── */
export async function approvePendingUser(userId: string) {
  const { supabase } = await requireAdmin()
  await supabase
    .from('profiles')
    .update({ status: 'approved' })
    .eq('id', userId)
  revalidatePath('/')
  return { success: true }
}

/* ──────────────────────────────────────────────────────
   Reject a user (admin only)
────────────────────────────────────────────────────── */
export async function rejectPendingUser(userId: string) {
  const { supabase } = await requireAdmin()
  await supabase
    .from('profiles')
    .update({ status: 'rejected' })
    .eq('id', userId)
  revalidatePath('/')
  return { success: true }
}

/* ──────────────────────────────────────────────────────
   Save the user's own Groq API key (any authenticated user)
────────────────────────────────────────────────────── */
export async function saveGroqApiKey(key: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = key.trim()
  if (!trimmed.startsWith('gsk_') && trimmed.length > 0) {
    return { error: 'Invalid key format — Groq keys start with gsk_' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ groq_api_key: trimmed || null })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}
