'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const field =
  'w-full border border-flax bg-paper px-3.5 py-3 text-sm outline-none transition-colors focus:border-ink'

type Mode = 'login' | 'link'

/**
 * Вхід паролем або листом із посиланням. Другий варіант потрібен тому, що
 * обліковий запис створюється автоматично після першої покупки — пароля
 * покупець ніколи не задавав.
 */
export const AuthForm = () => {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)

    try {
      if (mode === 'link') {
        const response = await fetch('/api/customers/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        })
        // Відповідь однакова незалежно від того, чи є така пошта в базі:
        // інакше форму можна використати для перевірки чужих адрес.
        setMessage(
          response.ok
            ? 'Якщо ця пошта в нас є, посилання для входу вже летить до вас.'
            : 'Не вдалось надіслати листа. Спробуйте ще раз.',
        )
      } else {
        const response = await fetch('/api/customers/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        })
        if (!response.ok) {
          setError('Пошта або пароль не підходять')
        } else {
          router.refresh()
        }
      }
    } catch {
      setError('Немає звʼязку з сервером')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex gap-6 border-b border-flax">
        {(
          [
            ['link', 'Посилання на пошту'],
            ['login', 'Пароль'],
          ] as [Mode, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value)
              setError(null)
              setMessage(null)
            }}
            className={`-mb-px border-b pb-3 text-sm transition-colors ${
              mode === value ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          required
          type="email"
          autoComplete="email"
          className={field}
          placeholder="Ваша пошта"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {mode === 'login' && (
          <input
            required
            type="password"
            autoComplete="current-password"
            className={field}
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {error && <p className="border border-brass/40 bg-brass/5 px-3 py-2 text-xs">{error}</p>}
        {message && <p className="border border-flax bg-paper-deep px-3 py-2 text-xs">{message}</p>}

        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? 'Хвилинку…' : mode === 'link' ? 'Надіслати посилання' : 'Увійти'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs leading-relaxed text-muted">
        Обліковий запис створюється автоматично після першої покупки — окремо
        реєструватись не треба.
      </p>
    </div>
  )
}
