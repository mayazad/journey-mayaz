'use client'

/**
 * MayazLogo — OSM lettermark.
 *
 * Using HTML/CSS absolute positioning instead of SVG text so we get
 * real browser font metrics and pixel-perfect placement.
 *
 * Layout:
 *   O  — bottom: 0 (grounded on baseline)
 *   S  — bottom: 10px (slightly raised, BETWEEN O and M, overlapping both)
 *   M  — bottom: 0 (grounded on baseline)
 *   S overlaps the right edge of O and the left edge of M by ~8-10px each.
 *
 * Colors (isometric cube palette):
 *   O, M → #064e3b  (cube darkest / shadow face)
 *   S    → #34d399  (cube brightest / top-lit face)
 */

interface MayazLogoProps {
  size?: number
  withWordmark?: boolean
  variant?: 'color' | 'white'
}

export function MayazLogo({ size = 32, withWordmark = false, variant = 'color' }: MayazLogoProps) {
  const nameColor = variant === 'white' ? '#fff'                  : '#0f172a'
  const osColor   = variant === 'white' ? 'rgba(255,255,255,0.85)': '#059669'
  const subColor  = variant === 'white' ? 'rgba(255,255,255,0.45)': '#9ca3af'
  const scale = size / 32

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.3, userSelect: 'none' }}>
      <OSMMarkCompact scale={scale} variant={variant} />
      {withWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: size * 0.44, fontWeight: 800, letterSpacing: '-0.025em', color: nameColor, fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>
              Mayaz
            </span>
            <span style={{ fontSize: size * 0.44, fontWeight: 800, letterSpacing: '-0.01em', color: osColor, fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>
              OS
            </span>
          </div>
          <span style={{ fontSize: size * 0.18, fontWeight: 500, letterSpacing: '0.13em', textTransform: 'uppercase', color: subColor, marginTop: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Personal System
          </span>
        </div>
      )}
    </div>
  )
}

export function MayazLogoCentered() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* OSM mark — large version */}
      <OSMMarkLarge />

      {/* Wordmark */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.035em', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>
            Mayaz
          </span>
          <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.01em', color: '#059669', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>
            OS
          </span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9ca3af', marginTop: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Personal System
        </div>
      </div>
    </div>
  )
}

/** Large centered mark for the login page */
function OSMMarkLarge() {
  const fs = 62          // O and M font-size
  const sFs = 62         // S same size as O/M
  const gap = -8         // negative = O/M overlap into S space
  const colOM = '#064e3b'
  const colS  = '#34d399'

  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'flex-end',      // align all three to the bottom (shared baseline)
      lineHeight: 1,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 900,
      overflow: 'visible',
    }}>
      {/* O */}
      <span style={{
        fontSize: fs,
        color: colOM,
        marginRight: gap,          // pull S closer so it overlaps O's right edge
        position: 'relative',
        zIndex: 0,
        letterSpacing: 0,
      }}>O</span>

      {/* S — same size, on same baseline, overlapping O and M edges */}
      <span style={
        {
        fontSize: sFs,
        color: colS,
        position: 'relative',
        marginBottom: 0,           // on the same baseline as O and M
        zIndex: 2,
        WebkitTextStroke: '2px rgba(250,250,249,0.8)',
        marginLeft: gap,
        marginRight: gap,
        letterSpacing: 0,
        }
      }>S</span>

      {/* M */}
      <span style={{
        fontSize: fs,
        color: colOM,
        marginLeft: gap,
        position: 'relative',
        zIndex: 0,
        letterSpacing: 0,
      }}>M</span>

      {/* Bottom fade — hides lower portion for the "faded" effect */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(to top, #fafaf9 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 3,
      }} />
    </div>
  )
}

/** Compact mark for sidebar */
function OSMMarkCompact({ scale, variant }: { scale: number; variant: 'color' | 'white' }) {
  const fs = 28 * scale
  const sBump = 5 * scale
  const gap = -3 * scale
  const colOM = variant === 'white' ? 'rgba(255,255,255,0.6)' : '#064e3b'
  const colS  = variant === 'white' ? '#fff' : '#34d399'
  const bgBase = variant === 'white' ? 'transparent' : '#fafaf9'

  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'flex-end',
      lineHeight: 1,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 900,
      overflow: 'visible',
    }}>
      <span style={{ fontSize: fs, color: colOM, marginRight: gap, position: 'relative', zIndex: 0 }}>O</span>
      <span style={{
        fontSize: fs, color: colS, position: 'relative', marginBottom: 0, zIndex: 2,
        WebkitTextStroke: `${1.5 * scale}px rgba(250,250,249,0.85)`,
        marginLeft: gap, marginRight: gap,
      }}>S</span>
      <span style={{ fontSize: fs, color: colOM, marginLeft: gap, position: 'relative', zIndex: 0 }}>M</span>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%',
        background: `linear-gradient(to top, ${bgBase} 0%, transparent 100%)`,
        pointerEvents: 'none', zIndex: 3,
      }} />
    </div>
  )
}
