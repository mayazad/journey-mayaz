'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateWhatsAppKeys(phone: string | null, apiKey: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      callmebot_phone: phone, 
      callmebot_api_key: apiKey 
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  
  revalidatePath('/settings')
  return { success: true }
}
