'use client'

import { BottomNav } from './BottomNav'

/**
 * Shared instant-loading skeleton shown while page server components fetch data.
 * Mirrors the AppShell chrome so the navigation feels alive immediately.
 */
export function PageSkeleton({ title }: { title?: string }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      {/* Fake sticky header — matches MobileHeader height/style */}
      <header
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: '60px',
          background: 'rgba(250,250,249,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>
          Mayaz OS
        </span>
        {/* Fake avatar skeleton */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'var(--border)',
          animation: 'sk-pulse 1.6s ease-in-out infinite',
        }} />
      </header>

      {/* Content skeleton */}
      <div
        style={{
          flex: 1,
          paddingTop: '60px', /* header height */
          paddingBottom: '120px',
        }}
        className="ml-0 md:ml-[240px]"
      >
        {/* Title area */}
        <div style={{ padding: '24px 20px 12px' }}>
          {title ? (
            <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
              {title}
            </h1>
          ) : (
            <>
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes sk-pulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.7; }
                  }
                `
              }} />
              <div style={{ width: '40%', height: '28px', borderRadius: '8px', background: 'var(--border-2)', animation: 'sk-pulse 1.6s ease-in-out infinite', marginBottom: '8px' }} />
              <div style={{ width: '25%', height: '14px', borderRadius: '6px', background: 'var(--border)', animation: 'sk-pulse 1.6s ease-in-out infinite' }} />
            </>
          )}
        </div>

        {/* Content skeletons */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes sk-pulse {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.7; }
              }
            `
          }} />

          {/* Card 1 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ width: '30%', height: '12px', borderRadius: '6px', background: 'var(--border-2)', animation: 'sk-pulse 1.6s ease-in-out infinite' }} />
            <div style={{ width: '100%', height: '11px', borderRadius: '6px', background: 'var(--border)', animation: 'sk-pulse 1.6s ease-in-out infinite 0.1s' }} />
            <div style={{ width: '85%', height: '11px', borderRadius: '6px', background: 'var(--border)', animation: 'sk-pulse 1.6s ease-in-out infinite 0.2s' }} />
            <div style={{ width: '70%', height: '11px', borderRadius: '6px', background: 'var(--border)', animation: 'sk-pulse 1.6s ease-in-out infinite 0.3s' }} />
          </div>

          {/* Card 2 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ width: '25%', height: '12px', borderRadius: '6px', background: 'var(--border-2)', animation: 'sk-pulse 1.6s ease-in-out infinite 0.15s' }} />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 0',
                  borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--border)', animation: `sk-pulse 1.6s ease-in-out infinite ${i * 0.1}s`, flexShrink: 0 }} />
                <div style={{ flex: 1, height: '11px', borderRadius: '6px', background: 'var(--border)', animation: `sk-pulse 1.6s ease-in-out infinite ${i * 0.1 + 0.05}s` }} />
                <div style={{ width: '36px', height: '11px', borderRadius: '6px', background: 'var(--border)', animation: `sk-pulse 1.6s ease-in-out infinite ${i * 0.1 + 0.1}s`, flexShrink: 0 }} />
              </div>
            ))}
          </div>

          {/* Card 3 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ width: '35%', height: '12px', borderRadius: '6px', background: 'var(--border-2)', animation: 'sk-pulse 1.6s ease-in-out infinite 0.2s' }} />
            <div style={{ width: '100%', height: '11px', borderRadius: '6px', background: 'var(--border)', animation: 'sk-pulse 1.6s ease-in-out infinite 0.3s' }} />
            <div style={{ width: '60%', height: '11px', borderRadius: '6px', background: 'var(--border)', animation: 'sk-pulse 1.6s ease-in-out infinite 0.4s' }} />
          </div>
        </div>
      </div>

      {/* Real BottomNav — stays visible during loading */}
      <BottomNav />
    </div>
  )
}
