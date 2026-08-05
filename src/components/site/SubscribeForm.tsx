'use client'

import { useState } from 'react'

export const SubscribeForm = () => {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  if (state === 'done') {
    return (
      <p className="mt-3 border-b border-ink py-2 text-sm">
        Готово. Тепер новинки приходитимуть вам першою.
      </p>
    )
  }

  return (
    <form
      className="mt-3"
      onSubmit={async (event) => {
        event.preventDefault()
        setState('busy')
        setMessage(null)
        try {
          const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, source: 'footer' }),
          })
          const data = (await response.json()) as { error?: string }
          if (!response.ok) {
            setMessage(data.error ?? 'Не вдалось підписати')
            setState('error')
            return
          }
          setState('done')
        } catch {
          setMessage('Немає звʼязку з сервером')
          setState('error')
        }
      }}
    >
      <div className="flex border-b border-ink">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ваша@пошта.com"
          aria-label="Ваша пошта"
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted"
        />
        <button type="submit" disabled={state === 'busy'} className="label py-2 text-ink">
          {state === 'busy' ? '…' : 'Підписатись'}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-brass">{message}</p>}
    </form>
  )
}
