'use client'

import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const field =
  'w-full border border-flax bg-paper px-3.5 py-3 text-sm outline-none transition-colors focus:border-ink'

export const ResetForm = ({ token }: { token?: string }) => {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!token) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <p className="text-sm text-muted">Посилання неповне або застаріле.</p>
        <Link href="/account" className="btn btn-outline mt-6">
          Отримати нове
        </Link>
      </div>
    )
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Пароль має бути щонайменше з 8 символів')
      return
    }

    setBusy(true)
    try {
      const response = await fetch('/api/customers/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!response.ok) {
        setError('Посилання застаріло. Запросіть нове.')
        setBusy(false)
        return
      }
      router.push('/account')
      router.refresh()
    } catch {
      setError('Немає звʼязку з сервером')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3">
      <input
        required
        type="password"
        autoComplete="new-password"
        className={field}
        placeholder="Новий пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="border border-brass/40 bg-brass/5 px-3 py-2 text-xs">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? 'Зберігаємо…' : 'Зберегти й увійти'}
      </button>
    </form>
  )
}
