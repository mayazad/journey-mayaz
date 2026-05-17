import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Clock } from 'lucide-react'

export const metadata: Metadata = { title: 'Pending Approval — Mayaz OS' }

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Redirect instantly if the admin has already approved or rejected their account
  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if (profile?.status === 'approved') redirect('/home')
  if (profile?.status === 'rejected') redirect('/rejected')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a1a14 0%, #0d2318 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto 24px',
          background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Clock size={28} color="#f59e0b" style={{ strokeWidth: 2.2 }} />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '-0.03em' }}>
          Waiting for Approval
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '32px' }}>
          Your account has been created and is pending review by the admin.
          You&apos;ll be able to access your dashboard once approved.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px', padding: '16px 20px', marginBottom: '28px',
          fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6,
        }}>
          Signed in as <span style={{ color: '#34d399', fontWeight: 600 }}>{user.email}</span>
        </div>

        <form action="/auth/signout" method="post">
          <Link href="/auth/signout" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '11px 24px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600,
            textDecoration: 'none',
          }}>
            Sign Out
          </Link>
        </form>
      </div>
    </div>
  )
}
