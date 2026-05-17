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

/* ──────────────────────────────────────────────────────
   Update standard user profile full name
────────────────────────────────────────────────────── */
export async function updateProfileName(fullName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = fullName.trim()
  if (trimmed.length === 0) return { error: 'Name cannot be empty' }

  // 1. Update in the profiles table
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ full_name: trimmed })
    .eq('id', user.id)

  if (profileErr) return { error: profileErr.message }

  // 2. Update in auth user metadata to keep in sync
  const { error: authErr } = await supabase.auth.updateUser({
    data: { full_name: trimmed }
  })

  if (authErr) return { error: authErr.message }

  revalidatePath('/settings')
  return { success: true }
}

/* ──────────────────────────────────────────────────────
   Resolve a unique username to email for sign-in (public)
────────────────────────────────────────────────────── */
export async function resolveUsername(username: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('resolve_username_to_email', { p_username: username.trim() })

  if (error) {
    console.error('RPC resolve_username_to_email error:', error)
    return null
  }
  return data as string | null
}

/* ──────────────────────────────────────────────────────
   Securely delete the authenticated user's own account (blocking admins)
────────────────────────────────────────────────────── */
export async function deleteOwnAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Call the secure public RPC delete function
  const { error } = await supabase.rpc('delete_own_user')
  if (error) return { error: error.message }

  // Sign out and clear browser session
  await supabase.auth.signOut()
  return { success: true }
}
