'use client'

import { useState } from 'react'

import { useLocale } from '@/components/site/LocaleLink'
import { SideDrawer } from '@/components/site/SideDrawer'
import { dictionary, type Locale } from '@/lib/i18n'
import type { Review } from '@/payload-types'

/*
  Блок відгуків за макетом (секція «Відгуки» 135:2815 на сторінці товару,
  139:3316 на сторінці набору, 137:2861 на сторінці курсу — усі три однакові;
  мобільна 311:6288; картка — компонент «Відгук» 134:2).

  Секція: смуга #F4F4F4 на всю ширину, падінги 96/120 на десктопі та 48/56 на
  мобільному, всередині контейнер 1360 з кроком 48 (28 на мобільному).

  Порядок усередині картки саме такий, як у макеті: зірки з датою, потім текст,
  і аж унизу автор. Автор — «ОКСАНА · КИЇВ», великими, 11/15.4 з розрядкою.

  Форма додавання живе в бічній шухляді (SideDrawer), як фільтри каталогу.
  У макеті її немає взагалі — це свідомий відступ на прохання замовника.
*/

/** Зірка з макета: 12×12 у картці, 14×14 у підсумку секції. */
const Star = ({ filled, size }: { filled: boolean; size: number }) => (
  <svg
    viewBox="0 0 12 12"
    aria-hidden="true"
    style={{ width: size, height: size }}
    className={filled ? 'text-ink' : 'text-ink/20'}
    fill="currentColor"
  >
    <path d="M6 0.6l1.65 3.53 3.75.47-2.76 2.6.72 3.8L6 9.15 2.64 11l.72-3.8L0.6 4.6l3.75-.47z" />
  </svg>
)

const Stars = ({ value, size, gap }: { value: number; size: number; gap: number }) => (
  <span className="inline-flex items-center" style={{ gap }} role="img" aria-label={`${value} / 5`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} filled={star <= Math.round(value)} size={size} />
    ))}
  </span>
)

/** «14 лютого 2026» — так дата підписана в макеті. */
const formatDate = (value: string | null | undefined, locale: Locale) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const formatted = new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
  // Український формат додає « р.» у кінці — у макеті його немає.
  return formatted.replace(/\s*р\.$/, '')
}

const FIELD =
  'w-full border border-ink/16 bg-paper px-3.5 py-3 text-[13px] leading-[19.5px] text-ink outline-none transition-colors placeholder:text-muted focus:border-ink'

type Target = { product: number } | { course: number }

export const Reviews = ({ reviews, target }: { reviews: Review[]; target: Target }) => {
  const locale = useLocale()
  const t = dictionary(locale).reviews
  const closeLabel = dictionary(locale).header.closeMenu

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ authorName: '', city: '', text: '', rating: 5 })
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
        setError(data.error ?? t.failed)
        setBusy(false)
        return
      }
      setSent(true)
      setBusy(false)
    } catch {
      setError(t.offline)
      setBusy(false)
    }
  }

  return (
    <>
      {/* Смуга #F4F4F4 на всю ширину екрана; контент — у контейнері. */}
      <section data-figma-node="135:2815" className="w-full bg-[#F4F4F4] py-12 md:py-[96px]">
        <div className="shell flex flex-col gap-7 md:gap-12">
          {/* Шапка секції — 135:2816. Десктоп: підсумок ліворуч, кнопка
              праворуч (SPACE_BETWEEN). Мобільний: стовпчиком. */}
          <div
            data-figma-node="135:2816"
            className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6"
          >
            <div data-figma-node="135:2817" className="flex flex-col gap-3">
              <p className="text-eyebrow uppercase text-muted">
                {t.label}
              </p>

              {average !== null && (
                <div className="flex items-center gap-3.5">
                  <span className="font-display text-title font-normal text-ink md:text-[27px] md:leading-[30.8px]">
                    {t.average(average)}
                  </span>
                  <Stars value={average} size={14} gap={4} />
                  <span className="text-[13px] leading-[19.5px] text-muted">
                    {t.count(reviews.length)}
                  </span>
                </div>
              )}
            </div>

            {/* Кнопка 200×44, рамка #16150F, радіус 2 — 135:2833. */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              data-figma-node="135:2833"
              className="inline-flex h-11 w-50 shrink-0 items-center justify-center whitespace-nowrap rounded-[2px] border border-ink text-[12px] font-semibold uppercase leading-[14.4px] tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {t.leave}
            </button>
          </div>

          {reviews.length > 0 ? (
            /* Сітка — 135:2835. Три колонки по 432 з кроком 32 на десктопі,
               стовпчик із кроком 28 на мобільному. */
            <div
              data-figma-node="135:2835"
              className="grid grid-cols-1 gap-7 md:grid-cols-3 md:gap-8"
            >
              {reviews.map((review) => {
                const date = formatDate(review.createdAt, locale)
                return (
                  <article key={review.id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Stars value={review.rating} size={12} gap={3} />
                      {date && <span className="text-[13px] leading-[19.5px] text-muted">{date}</span>}
                    </div>

                    <p className="text-[13px] leading-[19.5px] text-ink">{review.text}</p>

                    <p className="text-eyebrow uppercase text-muted">
                      {[review.authorName, review.city].filter(Boolean).join(' · ')}
                    </p>
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="text-[13px] leading-[19.5px] text-muted">{t.empty}</p>
          )}
        </div>
      </section>

      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={t.leave}
        closeLabel={closeLabel}
        footer={
          sent ? null : (
            <button
              type="submit"
              form="review-form"
              disabled={busy}
              className="mt-6 inline-flex h-11 shrink-0 items-center justify-center rounded-[2px] bg-ink px-8 text-[12px] font-semibold uppercase leading-[14.4px] tracking-[0.16em] text-paper transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {busy ? '…' : t.submit}
            </button>
          )
        }
      >
        {sent ? (
          <p className="text-[13px] leading-[19.5px] text-ink">{t.sent}</p>
        ) : (
          <form id="review-form" onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-eyebrow uppercase text-muted">
                {t.rating}
              </span>
              <span className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, rating: value }))}
                    aria-label={`${value} / 5`}
                    aria-pressed={form.rating === value}
                    className="p-0.5 transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <Star filled={value <= form.rating} size={18} />
                  </button>
                ))}
              </span>
            </label>

            <input
              required
              className={FIELD}
              placeholder={t.namePlaceholder}
              value={form.authorName}
              onChange={(e) => setForm((current) => ({ ...current, authorName: e.target.value }))}
            />

            <input
              className={FIELD}
              placeholder={t.cityPlaceholder}
              value={form.city}
              onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))}
            />

            <textarea
              required
              rows={6}
              className={`${FIELD} resize-none`}
              placeholder={t.textPlaceholder}
              value={form.text}
              onChange={(e) => setForm((current) => ({ ...current, text: e.target.value }))}
            />

            {error && (
              <p className="border border-brass/40 bg-brass/5 px-3 py-2 text-[12px] leading-[17px] text-ink">
                {error}
              </p>
            )}

            <p className="text-[12px] leading-[17px] text-muted">{t.moderationNote}</p>
          </form>
        )}
      </SideDrawer>
    </>
  )
}
