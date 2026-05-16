import { createClient } from '@/lib/supabase/server'
import Sidebar from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Desktop Sidebar — hidden on mobile via CSS */}
      <Sidebar userName={rawName} userEmail={userEmail} />

      {/* Main scrollable area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          overflowX: 'hidden',
          // On desktop push right of sidebar — done via media query in globals
        }}
        className="ml-0 md:ml-[240px]"
      >
        {/* Mobile sticky header */}
        <MobileHeader userName={displayName} userEmail={userEmail} />

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
