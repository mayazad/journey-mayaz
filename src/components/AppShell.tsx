import { getAuthUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { TimezoneSetter } from './TimezoneSetter'
import Sidebar from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'

export async function AppShell({ children }: { children: React.ReactNode }) {
  // Cached — if the page already called getAuthUser(), this is free (0 extra DB calls)
  const user = await getAuthUser()

  const rawName   = user?.user_metadata?.full_name as string | undefined
  const userEmail = user?.email

  // Smart name: skip "Md" prefix
  let displayName = rawName
  if (rawName) {
    const parts = rawName.trim().split(/\s+/)
    displayName = parts[0].toLowerCase() === 'md' && parts.length > 1
      ? parts[parts.length - 1]
      : parts[0]
  }

  // Fetch avatar and admin status from profiles
  const supabase = await createClient()
  const { data: profile } = user
    ? await supabase.from('profiles').select('avatar_url, is_admin').eq('id', user.id).single()
    : { data: null }
  const avatarUrl = profile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string | undefined) || null
  const isAdmin = profile?.is_admin || false

  let pendingCount = 0
  if (user && isAdmin) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    pendingCount = count || 0
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Timezone setter — client component, no React warnings */}
      <TimezoneSetter />

      {/* Desktop Sidebar — hidden on mobile via CSS */}
      <Sidebar
        userName={rawName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        isAdmin={isAdmin}
        initialPendingCount={pendingCount}
      />

      {/* Main scrollable area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          overflowX: 'hidden',
        }}
        className="ml-0 md:ml-[240px]"
      >
        {/* Mobile sticky header */}
        <MobileHeader
          userName={displayName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          isAdmin={isAdmin}
          initialPendingCount={pendingCount}
        />

        {/* Page content */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>

      {/* Floating bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
