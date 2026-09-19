'use client'

import { useState } from 'react'
import { useLocale } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'

export const ResendAccess = ({ courseId }: { courseId: number }) => {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const t = dictionary(useLocale()).account
  const [message, setMessage] = useState<string | null>(null)

  if (state === 'done') {
    return <span className="text-xs text-muted">Нове посилання вище — воно вже оновлене.</span>
  }

  // items-start: браузер сам центрує текст усередині <button>, а розтягнута на
  // всю колонку кнопка ставила напис її серединою — десь посеред рядка.
  return (
    <span className="flex flex-col items-start gap-1">
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
        className="thread-link text-xs text-muted transition-colors hover:text-ink active:text-ink/70"
      >
        {state === 'busy' ? t.resending : t.resend}
      </button>
      {message && <span className="text-xs text-brass">{message}</span>}
    </span>
  )
}
