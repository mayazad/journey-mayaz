'use client'

import { useState, useTransition, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Image from 'next/image'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string | null
  initials: string
}

export function AvatarUpload({ userId, currentAvatarUrl, initials }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(currentAvatarUrl ?? null)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus]          = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]      = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleClick() {
    fileInputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setStatus('error')
      setErrorMsg('Image must be under 2 MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      setStatus('error')
      setErrorMsg('Only image files are allowed')
      return
    }

    startTransition(async () => {
      setStatus('idle')
      const supabase = createClient()
      const ext      = file.name.split('.').pop()
      const path     = `${userId}/avatar.${ext}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' })

      if (uploadError) {
        setStatus('error')
        setErrorMsg(uploadError.message)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      // Save to profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, avatar_url: publicUrl, updated_at: new Date().toISOString() })

      if (profileError) {
        setStatus('error')
        setErrorMsg(profileError.message)
        return
      }

      // Also sync to auth user metadata for cross-session access
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })

      setAvatarUrl(`${publicUrl}?t=${Date.now()}`) // cache-bust
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
      {/* Avatar circle */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'var(--em-100)', border: '3px solid var(--em-200)',
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={80}
              height={80}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              unoptimized
            />
          ) : (
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--em-700)' }}>{initials}</span>
          )}
        </div>

        {/* Camera overlay button */}
        <button
          onClick={handleClick}
          disabled={isPending}
          style={{
            position: 'absolute', bottom: 0, right: 0,
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--em-500)', border: '2px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: isPending ? 'default' : 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {isPending
            ? <Loader2 size={13} color="#fff" className="animate-spin" />
            : <Camera size={13} color="#fff" />
          }
        </button>
      </div>

      {/* Label */}
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {isPending ? 'Uploading…' : 'Tap camera to change photo'}
      </p>
      <p style={{ fontSize: '11px', color: 'var(--border-2)' }}>Max 2 MB · JPG, PNG, WEBP</p>

      {/* Feedback */}
      {status === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '13px', color: 'var(--em-700)', background: 'var(--em-50)', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--em-200)' }}>
          <CheckCircle2 size={14} /> Photo updated
        </div>
      )}
      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '13px', color: '#dc2626', background: '#fef2f2', padding: '8px 14px', borderRadius: '10px', border: '1px solid #fecaca' }}>
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}
