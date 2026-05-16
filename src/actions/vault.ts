'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type VaultState = {
  error?: string
  success?: boolean
}

export async function addAccountMetadata(
  prevState: VaultState,
  formData: FormData
): Promise<VaultState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const service_name = formData.get('service_name') as string
  const email_used = formData.get('email_used') as string
  const auth_method = formData.get('auth_method') as string
  const notes = formData.get('notes') as string

  if (!service_name || !email_used || !auth_method) {
    return { error: 'Service name, email used, and auth method are required.' }
  }

  const { error } = await supabase.from('account_metadata').insert({
    user_id: user.id,
    service_name,
    email_used,
    auth_method,
    notes: notes || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/vault')
  return { success: true }
}

export async function getAccountMetadata() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('account_metadata')
    .select('*')
    .eq('user_id', user.id)
    .order('service_name', { ascending: true })

  if (error) {
    console.error('getAccountMetadata error:', error.message)
    return []
  }

  return data ?? []
}
