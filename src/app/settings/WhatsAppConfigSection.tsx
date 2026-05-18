'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Edit2, Loader2, MessageCircle } from 'lucide-react'
import { updateWhatsAppKeys } from '@/actions/profile'
import { clsx } from 'clsx'

export function WhatsAppConfigSection({ 
  currentPhone, 
  currentKey 
}: { 
  currentPhone: string | null; 
  currentKey: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [phone, setPhone] = useState(currentPhone || '')
  const [apiKey, setApiKey] = useState(currentKey || '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const res = await updateWhatsAppKeys(phone.trim() || null, apiKey.trim() || null)
      if (res.error) {
        alert(res.error)
      } else {
        setIsEditing(false)
      }
    })
  }

  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageCircle size={14} color="#10b981" /> WhatsApp Notifications
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
            Get free daily reminders for urgent academic tasks using the CallMeBot API. 
            <br />
            To get your key, add <strong style={{ color: 'var(--text-secondary)' }}>+34 693 54 27 68</strong> to contacts and text it: <em>"I allow callmebot to send me messages"</em>
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border)',
              background: 'var(--bg-surface)', color: 'var(--text-secondary)',
              fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
            }}
          >
            <Edit2 size={12} /> {currentPhone && currentKey ? 'Edit' : 'Configure'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Phone Number (International format, e.g. +880...)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 123 456 789"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '12px',
                    border: '1px solid var(--border)', background: 'var(--bg-surface)',
                    fontSize: '13px', color: 'var(--text-primary)', outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  CallMeBot API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="123456"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '12px',
                    border: '1px solid var(--border)', background: 'var(--bg-surface)',
                    fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  onClick={() => { setIsEditing(false); setPhone(currentPhone || ''); setApiKey(currentKey || '') }}
                  disabled={isPending}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border)',
                    background: 'none', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', border: 'none',
                    background: 'var(--em-600)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Save Keys
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isEditing && currentPhone && currentKey && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Configured for {currentPhone}
          </span>
        </div>
      )}
    </div>
  )
}
