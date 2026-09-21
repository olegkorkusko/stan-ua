'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Tabs } from '@/components/site/Tabs'

type Mode = 'login' | 'link' | 'register'

/*
  Реєстрація тимчасово прихована на прохання замовника.

  Причина: сама по собі вона нічого не дає. Доступи беруться з оплати, тож
  людина, яка зареєструвалась і нічого не купила, бачить порожній кабінет.
  А головний шлях сюди — «Посилання на пошту» після покупки, і третя вкладка
  поруч із ним радше збивала.

  Механізм лишився цілим: роут `/api/account/register` працює, гілка `register`
  у формі нижче теж. Повернути — поставити `true`, більше нічого.

  Ціна рішення: обране (серце на картках) вимагає кабінету, а завести його
  тепер можна лише покупкою. Гість, який тисне серце, потрапляє на /account і
  вперся: «Посилання» йому нічого не надішле, бо його пошти в базі ще немає.
  Тому перш ніж вмикати серце для гостей, треба або повернути реєстрацію, або
  заводити кабінет мовчки — прямо з натискання серця.
*/
const REGISTRATION_ENABLED = false

/**
 * Три способи потрапити в кабінет — усі три з пункту 7.1 обсягу робіт.
 *
 *   «Посилання на пошту» — головний шлях для того, хто вже купував: обліковий
 *   запис міг створитися сам після покупки курсу, і пароля людина не задавала.
 *   «Пароль» — для тих, хто його вже задав на /account/reset.
 *   «Реєстрація» — для тих, хто ще нічого не купував. Зараз прихована,
 *   див. REGISTRATION_ENABLED нижче.
 */
export const AuthForm = () => {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
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
      } else if (mode === 'register') {
        const created = await fetch('/api/account/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password, name }),
        })
        if (!created.ok) {
          const data = (await created.json()) as { error?: string }
          setError(data.error ?? 'Не вдалось зареєструватись')
          return
        }
        // Сесію відкриває штатний роут Payload — кукі ставить він сам.
        await fetch('/api/customers/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        })
        router.refresh()
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
      {/* Той самий рядок вкладок, що в кабінеті, лише вирівняний по центру. */}
      <Tabs
        items={[
          { key: 'link', title: 'Посилання' },
          { key: 'login', title: 'Пароль' },
          ...(REGISTRATION_ENABLED ? [{ key: 'register', title: 'Реєстрація' }] : []),
        ]}
        active={mode}
        onSelect={(key) => {
          setMode(key as Mode)
          setError(null)
          setMessage(null)
        }}
        align="center"
        label="Спосіб входу"
      />

      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          required
          type="email"
          autoComplete="email"
          className="field"
          placeholder="Ваша пошта"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {mode === 'register' && (
          <input
            className="field"
            autoComplete="name"
            placeholder="Імʼя (не обовʼязково)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        {mode !== 'link' && (
          <input
            required
            type="password"
            minLength={mode === 'register' ? 8 : undefined}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            className="field"
            placeholder={mode === 'register' ? 'Пароль, щонайменше 8 символів' : 'Пароль'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {error && <p className="border border-brass/40 bg-brass/5 px-3 py-2 text-xs">{error}</p>}
        {message && <p className="border border-flax bg-paper-deep px-3 py-2 text-xs">{message}</p>}

        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy
            ? 'Хвилинку…'
            : mode === 'link'
              ? 'Надіслати посилання'
              : mode === 'register'
                ? 'Створити кабінет'
                : 'Увійти'}
        </button>
      </form>

      {/*
        Підказка мусить іти за REGISTRATION_ENABLED. Поки реєстрація прихована,
        посилати по неї — глухий кут: вкладки «Реєстрація» на сторінці немає.
      */}
      <p className="mt-5 text-center text-xs leading-relaxed text-muted">
        Після покупки курсу кабінет створюється сам — тоді заходьте за посиланням
        на пошту.{' '}
        {REGISTRATION_ENABLED
          ? 'Реєстрація потрібна, якщо ви ще нічого не купували.'
          : 'Пароль — якщо ви вже задали його раніше.'}
      </p>
    </div>
  )
}
