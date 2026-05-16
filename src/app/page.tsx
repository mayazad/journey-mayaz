import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  if (!supabaseUrl.startsWith('http')) {
    // Dev mode without Supabase — go straight to home
    redirect('/home')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/home')
  else redirect('/login')
}
