'use client'

import { useState } from 'react'

export const ResendAccess = ({ courseId }: { courseId: number }) => {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  if (state === 'done') {
    return <span className="text-xs text-muted">Нове посилання вище — воно вже оновлене.</span>
  }

  return (
    <span className="flex flex-col gap-1">
      <button
        type="button"
        disabled={state === 'busy'}
        onClick={async () => {
          setState('busy')
          try {
            const response = await fetch('/api/account/resend', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ courseId }),
            })
            const data = (await response.json()) as { link?: string; error?: string }
            if (!response.ok) {
              setMessage(data.error ?? 'Не вдалось')
              setState('error')
              return
            }
            setState('done')
            window.location.reload()
          } catch {
            setMessage('Немає звʼязку з сервером')
            setState('error')
          }
        }}
        className="thread-link text-xs text-muted"
      >
        {state === 'busy' ? 'Випускаємо…' : 'Видати посилання ще раз'}
      </button>
      {message && <span className="text-xs text-brass">{message}</span>}
    </span>
  )
}
