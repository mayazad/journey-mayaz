'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface SubmitButtonProps {
  label: string
  pendingLabel?: string
}

export function SubmitButton({ label, pendingLabel = 'Saving...' }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        'btn btn-primary w-full flex items-center justify-center gap-2',
        pending && 'opacity-60 cursor-not-allowed'
      )}
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      {pending ? pendingLabel : label}
    </button>
  )
}
