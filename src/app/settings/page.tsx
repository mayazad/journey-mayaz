import { AppShell } from '@/components/AppShell'
import { getAuthUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Shield, Cpu, User, Info, Lock } from 'lucide-react'
import { ClearBriefingCacheButton } from './ClearBriefingCacheButton'
import { AvatarUpload } from './AvatarUpload'
import { GroqKeyInput } from './GroqKeyInput'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings — Mayaz OS',
}

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '0 4px' }}>
      {icon}
      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{title}</p>
    </div>
    <div style={{ background: '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
      {children}
    </div>
  </div>
)

const Row = ({ label, value, last }: { label: string; value?: string; last?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
    {value && <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: value.startsWith('✓') ? 'inherit' : 'inherit', fontWeight: value.startsWith('✓') ? 600 : 400 }}>{value}</span>}
  </div>
)

export default async function SettingsPage() {
  const user = await getAuthUser()
  const supabase = await createClient()

  const rawName = (user?.user_metadata?.full_name as string | undefined) ||
                  (user?.user_metadata?.name as string | undefined) ||
                  user?.email?.split('@')[0] || '—'
  const nameParts = rawName.trim().split(/\s+/)
  let firstName = nameParts[0]
  if (firstName.toLowerCase() === 'md' && nameParts.length > 1) {
    firstName = nameParts[nameParts.length - 1]
  }

  // Fetch avatar, admin flag, and groq key from profiles table
  const { data: profile } = user
    ? await supabase.from('profiles').select('avatar_url, is_admin, groq_api_key').eq('id', user.id).single()
    : { data: null }
  const avatarUrl = profile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string | undefined) || null
  const isAdmin   = profile?.is_admin ?? false
  const groqApiKey = (profile as { groq_api_key?: string | null } | null)?.groq_api_key ?? null

  const initials = rawName.trim().slice(0, 2).toUpperCase()

  const groqConfigured  = !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your-groq-api-key-here')
  const supabaseConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http'))

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>

        {/* Title */}
        <div style={{ padding: '24px 20px 16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Settings
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Preferences & account
          </p>
        </div>

        <div style={{ padding: '0 16px 120px' }}>

          {/* Account */}
          <Section title="Account" icon={<User size={13} color="var(--text-muted)" />}>
            {/* Avatar upload at top of account section */}
            {user && (
              <AvatarUpload
                userId={user.id}
                currentAvatarUrl={avatarUrl}
                initials={initials}
              />
            )}
            <Row label="Name" value={rawName} />
            <Row label="Email" value={user?.email || '—'} />
            <Row label="User ID" value={user?.id ? `${user.id.slice(0, 8)}…` : '—'} last />
          </Section>

          {/* AI Configuration */}
          <Section title="AI Configuration" icon={<Cpu size={13} color="var(--text-muted)" />}>
            {isAdmin ? (
              // Admin sees env key status
              <>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Groq API (Admin key)</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: groqConfigured ? 'var(--em-50)' : '#fef2f2', color: groqConfigured ? 'var(--em-700)' : '#dc2626', border: `1px solid ${groqConfigured ? 'var(--em-200)' : '#fecaca'}` }}>
                    {groqConfigured ? '✓ Connected' : '✗ Not set'}
                  </span>
                </div>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Supabase DB</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: supabaseConfigured ? 'var(--em-50)' : '#fef2f2', color: supabaseConfigured ? 'var(--em-700)' : '#dc2626', border: `1px solid ${supabaseConfigured ? 'var(--em-200)' : '#fecaca'}` }}>
                    {supabaseConfigured ? '✓ Connected' : '✗ Not set'}
                  </span>
                </div>
              </>
            ) : (
              // Non-admin must enter their own key
              <GroqKeyInput currentKey={groqApiKey} />
            )}
            <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>AI Model</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>llama-3.1-8b-instant</span>
            </div>
          </Section>

          {/* Data */}
          <Section title="Data & Privacy" icon={<Shield size={13} color="var(--text-muted)" />}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '2px' }}>Daily Briefing Cache</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cached twice per day (morning + afternoon)</p>
              </div>
              <ClearBriefingCacheButton userId={user?.id} />
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Lock size={14} color="var(--em-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Your <strong style={{ color: 'var(--text-secondary)' }}>Vault</strong> data is strictly private — AI models never have access to it. All data is isolated per user with Row Level Security (RLS) on Supabase.
                </p>
              </div>
            </div>
          </Section>

          {/* About */}
          <Section title="About" icon={<Info size={13} color="var(--text-muted)" />}>
            <Row label="Version" value="1.0.0" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Built by</span>
              <a href="https://www.linkedin.com/in/md-mayaz-ad/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'var(--em-600)', fontWeight: 600, textDecoration: 'none' }}>Md Adnan Hossain Mayaz</a>
            </div>
            <Row label="Stack" value="Next.js 15 · Supabase · Groq" last />
          </Section>

          {/* Copyright */}
          <div style={{ textAlign: 'center', padding: '8px 20px 0' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              © {new Date().getFullYear()} Mayaz OS — All rights reserved.
              <br />
              Personal use only. Not licensed for redistribution.
            </p>
          </div>

        </div>
      </div>
    </AppShell>
  )
}
