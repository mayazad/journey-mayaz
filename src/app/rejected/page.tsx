import Link from 'next/link'
import type { Metadata } from 'next'
import { ShieldAlert } from 'lucide-react'

export const metadata: Metadata = { title: 'Account Not Approved — Mayaz OS' }

export default function RejectedPage() {
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
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldAlert size={28} color="#ef4444" style={{ strokeWidth: 2.2 }} />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '-0.03em' }}>
          Account Not Approved
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '32px' }}>
          Your account request was not approved at this time.
          If you believe this is a mistake, please contact the admin directly.
        </p>

        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '11px 24px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600,
          textDecoration: 'none',
        }}>
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
