'use client'

import { useState } from 'react'

import type { Review } from '@/payload-types'
import { useLocale } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'

const Stars = ({ value }: { value: number }) => (
  <span className="text-brass" aria-label={`${value} з 5`}>
    {'★'.repeat(value)}
    <span className="text-flax">{'★'.repeat(5 - value)}</span>
  </span>
)

const field =
  'w-full border border-flax bg-paper px-3.5 py-3 text-sm outline-none transition-colors focus:border-ink'

type Target = { product: number } | { course: number }

export const Reviews = ({ reviews, target }: { reviews: Review[]; target: Target }) => {
  const [open, setOpen] = useState(false)
  const t = dictionary(useLocale()).reviews
  const [form, setForm] = useState({ authorName: '', text: '', rating: 5 })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const average = reviews.length
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...target }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error ?? 'Не вдалось надіслати')
        setBusy(false)
        return
      }
      setSent(true)
    } catch {
      setError('Немає звʼязку з сервером')
      setBusy(false)
    }
  }

  return (
    <section className="mt-24 max-w-3xl">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="label">{t.label}</p>
          {average !== null && (
            <p className="mt-3 flex items-center gap-3 text-2xl">
              <Stars value={Math.round(average)} />
              <span className="price text-base text-muted">{t.average(average)}</span>
            </p>
          )}
        </div>

        {!open && !sent && (
          <button type="button" onClick={() => setOpen(true)} className="btn btn-outline">
            {t.leave}
          </button>
        )}
      </div>

      {sent && (
        <p className="mt-6 border border-flax bg-paper-deep px-4 py-3 text-sm">
          {t.sent}
        </p>
      )}

      {open && !sent && (
        <form onSubmit={submit} className="mt-6 space-y-3 border border-flax p-6">
          <input
            required
            className={field}
            placeholder={t.namePlaceholder}
            value={form.authorName}
            onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
          />

          <div className="flex items-center gap-3">
            <span className="label">{t.rating}</span>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, rating: value }))}
                aria-label={`${value} з 5`}
                aria-pressed={form.rating === value}
                className={`text-lg ${value <= form.rating ? 'text-brass' : 'text-flax'}`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            required
            rows={4}
            className={`${field} resize-none`}
            placeholder={t.textPlaceholder}
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          />

          {error && <p className="border border-brass/40 bg-brass/5 px-3 py-2 text-xs">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? '…' : t.submit}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-outline">
              {t.cancel}
            </button>
          </div>
        </form>
      )}

      {reviews.length > 0 ? (
        <ul className="mt-8 divide-y divide-flax border-t border-flax">
          {reviews.map((review) => (
            <li key={review.id} className="py-6">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-medium">{review.authorName}</span>
                <Stars value={review.rating} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{review.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 border-t border-flax pt-6 text-sm text-muted">
          {t.empty}
        </p>
      )}
    </section>
  )
}
