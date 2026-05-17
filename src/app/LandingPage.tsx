'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import {
  Sparkles, Dumbbell, GraduationCap, BookOpen,
  Vault, Salad, ArrowRight, Shield, Zap, Users,
} from 'lucide-react'

/* ──────────────────────────────────────────────
   Feature data
────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Daily Briefing',
    desc: 'Every morning and afternoon, your personal AI composes a custom briefing — workouts, deadlines, and motivations, tailored to you.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
  },
  {
    icon: Dumbbell,
    title: 'Fitness Planner',
    desc: 'Set a weekly workout plan, log warmups, rest intervals, and track time-based sets. Supports ChatGPT-style training formats.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
  },
  {
    icon: GraduationCap,
    title: 'Academics Hub',
    desc: 'Manage assignment deadlines, exam dates, and presentations. The AI can parse and add tasks from plain text.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
  },
  {
    icon: BookOpen,
    title: 'Learning Roadmaps',
    desc: 'Build visual learning paths for any skill. Track nodes, attach notes, and let the AI parse course outlines into structured roadmaps.',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.08)',
  },
  {
    icon: Salad,
    title: 'Diet & Sleep Tracker',
    desc: 'Log meals in plain English — the AI identifies macros automatically. Track sleep duration and get health insights.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
  },
  {
    icon: Vault,
    title: 'Private Vault',
    desc: 'A personal encrypted space for sensitive notes, links, and credentials. The AI never has access to vault data.',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
  },
]

const STEPS = [
  { n: '01', title: 'Create your account', desc: 'Sign up with email or Google in under 30 seconds. Your dashboard is instantly ready.' },
  { n: '02', title: 'Set up your profile', desc: 'Add your weekly workout plan, academic deadlines, and learning goals at your own pace.' },
  { n: '03', title: 'Let the AI manage your day', desc: 'Wake up to a personalized briefing. Chat with your AI assistant any time. Stay on track effortlessly.' },
]

/* ──────────────────────────────────────────────
   Animated section wrapper
────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className, style }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/* ──────────────────────────────────────────────
   Main landing page
────────────────────────────────────────────── */
export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroY       = useTransform(scrollYProgress, [0, 0.8], [0, -60])

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden', background: '#f0f0f0' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 60px)',
        height: '60px',
        background: 'rgba(10,26,20,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(16,185,129,0.12)',
      }}>
        <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.4px', color: '#fff' }}>
          Mayaz<span style={{ color: '#10b981' }}>OS</span>
        </span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/login" style={{
            fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
            textDecoration: 'none', padding: '7px 14px', borderRadius: '8px',
            transition: 'color 0.2s',
          }}>
            Sign In
          </Link>
          <Link href="/login?mode=signup" style={{
            fontSize: '13px', fontWeight: 700, color: '#fff',
            background: '#10b981', textDecoration: 'none',
            padding: '8px 18px', borderRadius: '8px',
            transition: 'background 0.2s',
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #0a1a14 0%, #0d2318 40%, #0a1a14 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          padding: '120px clamp(20px,5vw,60px) 80px',
          textAlign: 'center',
        }}
      >
        {/* Ambient orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '15%', left: '10%',
              width: 'clamp(200px, 35vw, 480px)', height: 'clamp(200px, 35vw, 480px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)',
            }}
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            style={{
              position: 'absolute', bottom: '10%', right: '8%',
              width: 'clamp(180px, 30vw, 420px)', height: 'clamp(180px, 30vw, 420px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 70%)',
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
            style={{
              position: 'absolute', top: '45%', right: '20%',
              width: 'clamp(120px, 20vw, 280px)', height: 'clamp(120px, 20vw, 280px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(5,150,105,0.2) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }} />

        <motion.div style={{ opacity: heroOpacity, y: heroY, position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 14px', borderRadius: '20px', marginBottom: '28px',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              fontSize: '12px', fontWeight: 700, color: '#34d399',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}
          >
            <Zap size={11} /> Powered by Groq AI
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 'clamp(36px, 7vw, 80px)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              color: '#fff',
              marginBottom: '24px',
              maxWidth: '820px',
            }}
          >
            Your Personal{' '}
            <span style={{
              background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              AI Operating System
            </span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.65,
              maxWidth: '560px',
              margin: '0 auto 40px',
              fontWeight: 400,
            }}
          >
            Track fitness, learning, academics, and daily life — all in one place.
            Your AI briefings you every morning. You stay in control.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link href="/login?mode=signup" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff', fontWeight: 700, fontSize: '15px',
              textDecoration: 'none',
              boxShadow: '0 4px 32px rgba(16,185,129,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}>
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '15px',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}>
              Sign In
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            style={{
              display: 'flex', gap: 'clamp(24px, 4vw, 48px)', justifyContent: 'center',
              marginTop: '56px', flexWrap: 'wrap',
            }}
          >
            {[
              { icon: <Shield size={14} />, label: 'Private by design' },
              { icon: <Zap size={14} />, label: 'Instant AI responses' },
              { icon: <Users size={14} />, label: 'Your data, only yours' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontWeight: 500 }}>
                <span style={{ color: '#34d399' }}>{s.icon}</span>
                {s.label}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)' }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '24px', height: '38px', border: '2px solid rgba(16,185,129,0.4)', borderRadius: '12px', display: 'flex', justifyContent: 'center', paddingTop: '6px' }}
          >
            <div style={{ width: '3px', height: '8px', background: '#10b981', borderRadius: '2px' }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) clamp(20px, 5vw, 60px)', background: '#f0f0f0' }}>
        <FadeUp style={{ textAlign: 'center', marginBottom: '52px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#10b981', marginBottom: '12px' }}>Everything you need</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#111827', lineHeight: 1.15 }}>
            One OS. Six superpowers.
          </h2>
          <p style={{ fontSize: '16px', color: '#6b7280', marginTop: '12px', maxWidth: '480px', margin: '12px auto 0', lineHeight: 1.65 }}>
            Everything syncs together. Your workout shows up in your briefing. Your deadlines show up in your chat.
          </p>
        </FadeUp>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(260px, 30vw, 340px), 1fr))',
          gap: '16px', maxWidth: '1100px', margin: '0 auto',
        }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <FadeUp key={f.title} delay={i * 0.07}>
                <div style={{
                  background: '#fff', borderRadius: '20px', padding: '24px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(-3px)'
                    el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <Icon size={22} color={f.color} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{f.title}</h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </FadeUp>
            )
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) clamp(20px, 5vw, 60px)', background: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: '52px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#10b981', marginBottom: '12px' }}>Simple setup</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#111827' }}>Up and running in minutes</h2>
          </FadeUp>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {STEPS.map((s, i) => (
              <FadeUp key={s.n} delay={i * 0.1}>
                <div style={{
                  display: 'flex', gap: '24px', alignItems: 'flex-start',
                  padding: '24px',
                  borderRadius: '16px',
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f0fdf4' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                    border: '1px solid #a7f3d0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>{s.n}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>{s.title}</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIVACY STRIP ── */}
      <section style={{ padding: 'clamp(48px, 6vw, 72px) clamp(20px, 5vw, 60px)', background: '#ecfdf5', borderTop: '1px solid #a7f3d0', borderBottom: '1px solid #a7f3d0' }}>
        <FadeUp>
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '16px', background: '#fff', border: '1px solid #a7f3d0', marginBottom: '20px' }}>
              <Shield size={24} color="#059669" strokeWidth={1.8} />
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#064e3b', letterSpacing: '-0.02em', marginBottom: '12px' }}>
              Your data. Only yours.
            </h2>
            <p style={{ fontSize: '15px', color: '#047857', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
              Every table in the database is protected by Row Level Security. The AI assistant never has access to your Vault data.
              No tracking, no ads, no sharing — ever.
            </p>
          </div>
        </FadeUp>
      </section>

      {/* ── CTA FOOTER ── */}
      <section style={{
        padding: 'clamp(80px, 10vw, 120px) clamp(20px, 5vw, 60px)',
        background: 'linear-gradient(160deg, #0a1a14 0%, #0d2318 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 65%)' }}
          />
        </div>
        <FadeUp style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(30px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.1, marginBottom: '16px' }}>
            Start organizing<br />
            <span style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              your life today.
            </span>
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginBottom: '36px', lineHeight: 1.6 }}>
            Free to use. No credit card required.
          </p>
          <Link href="/login?mode=signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '16px 36px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff', fontWeight: 800, fontSize: '17px',
            textDecoration: 'none',
            boxShadow: '0 8px 48px rgba(16,185,129,0.4)',
          }}>
            Get Started <ArrowRight size={18} />
          </Link>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '20px' }}>
            Sign up takes under 30 seconds
          </p>
        </FadeUp>
      </section>

      {/* ── FOOTER BAR ── */}
      <footer style={{ background: '#060f09', padding: '20px clamp(20px, 5vw, 60px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            Mayaz<span style={{ color: '#10b981' }}>OS</span>
          </span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/login" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Sign In</Link>
            <Link href="/login?mode=signup" style={{ fontSize: '12px', color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>Sign Up</Link>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '10px' }}>
          © {new Date().getFullYear()} Mayaz OS · Personal use
        </p>
      </footer>
    </div>
  )
}
