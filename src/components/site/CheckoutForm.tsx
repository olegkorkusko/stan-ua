'use client'

import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { useEffect, useRef, useState } from 'react'

import { track } from '@/components/site/Analytics'
import { formatPrice } from '@/lib/format'
import { useCart } from '@/providers/CartProvider'
import { useLocale } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'

type Suggestion = { label: string; ref: string }

/**
 * Кукі пікселя Meta. Їх не існує, якщо людина не дала згоди на cookie —
 * тоді серверна подія покупки просто піде без них, за поштою й телефоном.
 */
const readCookie = (name: string): string | undefined =>
  document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.slice(name.length + 1)

const DELIVERY = [
  { value: 'np_branch', label: 'Нова Пошта — відділення' },
  { value: 'np_locker', label: 'Нова Пошта — поштомат' },
  { value: 'np_courier', label: "Нова Пошта — кур'єр до дверей" },
  { value: 'ukrposhta', label: 'Укрпошта' },
]

/**
 * Підказки адрес з невеликою затримкою, щоб не смикати API на кожну літеру.
 * `enabled` вимикає їх для Укрпошти: довідник Нової Пошти для неї не підходить.
 */
const useSuggestions = (type: 'city' | 'branch', query: string, cityRef?: string, enabled = true) => {
  const [items, setItems] = useState<Suggestion[]>([])
  const [manual, setManual] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setItems([])
      return
    }
    if (type === 'branch' && !cityRef) return
    if (type === 'city' && query.trim().length < 2) {
      setItems([])
      return
    }

    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ type, q: query })
      if (cityRef) params.set('ref', cityRef)
      try {
        const response = await fetch(`/api/nova-poshta?${params}`)
        const data = (await response.json()) as { items: Suggestion[]; manual?: boolean }
        setItems(data.items ?? [])
        setManual(Boolean(data.manual))
      } catch {
        setManual(true)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [type, query, cityRef, enabled])

  return { items, manual }
}

export const CheckoutForm = () => {
  const { items, total, clear } = useCart()
  const t = dictionary(useLocale()).checkout
  const formRef = useRef<HTMLFormElement>(null)

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    comment: '',
    promoCode: '',
    deliveryMethod: 'np_branch',
    paymentMethod: 'card' as 'card' | 'cod',
    newsletter: false,
  })
  const [city, setCity] = useState({ label: '', ref: '' })
  const [branch, setBranch] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [branchQuery, setBranchQuery] = useState('')
  const [postcode, setPostcode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const hasPhysical = items.some((item) => item.kind === 'product')
  const hasCourse = items.some((item) => item.kind === 'course')
  const codAllowed = hasPhysical && !hasCourse

  // Укрпошта має власну адресну логіку: місто, вулиця й індекс, без довідника
  // відділень Нової Пошти.
  const isUkrposhta = form.deliveryMethod === 'ukrposhta'

  const cities = useSuggestions('city', cityQuery, undefined, !isUkrposhta)
  const branches = useSuggestions('branch', branchQuery, city.ref, !isUkrposhta)

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)

    // Пошта потрібна не лише для замовлення: якщо людина не дійде до оплати,
    // саме за нею піде лист про кинутий кошик.
    void fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.customerEmail,
        items: items.map((item) => ({
          kind: item.kind,
          itemId: item.id,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      }),
    }).catch(() => undefined)

    track('begin_checkout', {
      currency: 'UAH',
      value: total,
      items: items.map((item) => ({ item_id: item.id, item_name: item.title, price: item.price })),
    })

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fbp: readCookie('_fbp'),
          fbc: readCookie('_fbc'),
          paymentMethod: codAllowed ? form.paymentMethod : 'card',
          deliveryCity: hasPhysical ? city.label || cityQuery : undefined,
          deliveryBranch: hasPhysical ? branch || branchQuery : undefined,
          deliveryPostcode: hasPhysical && isUkrposhta ? postcode : undefined,
          items: items.map((item) => ({
            kind: item.kind,
            id: item.id,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      })

      const data = (await response.json()) as {
        error?: string
        redirect?: string
        payment?: { url: string; fields: Record<string, string | string[]> }
      }

      if (!response.ok) {
        setError(data.error ?? 'Не вдалось оформити замовлення')
        setBusy(false)
        return
      }

      clear()

      if (data.payment) {
        // WayForPay приймає тільки form-post, тому збираємо форму й надсилаємо.
        const paymentForm = document.createElement('form')
        paymentForm.method = 'POST'
        paymentForm.action = data.payment.url
        paymentForm.acceptCharset = 'utf-8'

        for (const [name, value] of Object.entries(data.payment.fields)) {
          for (const single of Array.isArray(value) ? value : [value]) {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = Array.isArray(value) ? `${name}[]` : name
            input.value = single
            paymentForm.append(input)
          }
        }

        document.body.append(paymentForm)
        paymentForm.submit()
        return
      }

      if (data.redirect) window.location.href = data.redirect
    } catch {
      setError('Немає звʼязку з сервером. Спробуйте ще раз.')
      setBusy(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted">{t.empty}</p>
        <Link href="/courses" className="btn btn-outline mt-6">
          Обрати курс
        </Link>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
      <div className="space-y-10">
        <section>
          <p className="label">{t.contacts}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              className="field"
              placeholder={t.name}
              value={form.customerName}
              onChange={(e) => set('customerName')(e.target.value)}
            />
            <input
              required
              type="tel"
              className="field"
              placeholder="+380"
              value={form.customerPhone}
              onChange={(e) => set('customerPhone')(e.target.value)}
            />
            <input
              required
              type="email"
              className="field sm:col-span-2"
              placeholder={t.email}
              value={form.customerEmail}
              onChange={(e) => set('customerEmail')(e.target.value)}
            />
          </div>
          {hasCourse && (
            <p className="mt-2 text-xs text-muted">
              {t.emailNote}
            </p>
          )}
        </section>

        {hasPhysical && (
          <section>
            <p className="label">{t.delivery}</p>
            <div className="mt-4 space-y-2">
              {DELIVERY.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 border px-3.5 py-3 text-sm transition-colors ${
                    form.deliveryMethod === option.value ? 'border-ink' : 'border-flax hover:border-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={option.value}
                    checked={form.deliveryMethod === option.value}
                    onChange={(e) => set('deliveryMethod')(e.target.value)}
                    className="accent-ink"
                  />
                  {option.label}
                </label>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              <div className="relative">
                <input
                  className="field"
                  placeholder={t.city}
                  value={cityQuery}
                  onChange={(e) => {
                    setCityQuery(e.target.value)
                    setCity({ label: '', ref: '' })
                    setBranch('')
                  }}
                />
                {cities.items.length > 0 && !city.ref && (
                  <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-flax bg-paper shadow-sm">
                    {cities.items.map((item) => (
                      <li key={item.ref}>
                        <button
                          type="button"
                          className="w-full px-3.5 py-2 text-left text-sm hover:bg-paper-deep"
                          onClick={() => {
                            setCity(item)
                            setCityQuery(item.label)
                          }}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative">
                <input
                  className="field"
                  placeholder={
                    form.deliveryMethod === 'np_courier' || isUkrposhta ? t.address : t.branch
                  }
                  value={branch || branchQuery}
                  onChange={(e) => {
                    setBranchQuery(e.target.value)
                    setBranch('')
                  }}
                />
                {branches.items.length > 0 && !branch && form.deliveryMethod !== 'np_courier' && (
                  <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-flax bg-paper shadow-sm">
                    {branches.items.map((item) => (
                      <li key={item.ref}>
                        <button
                          type="button"
                          className="w-full px-3.5 py-2 text-left text-sm hover:bg-paper-deep"
                          onClick={() => setBranch(item.label)}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {isUkrposhta && (
                <div>
                  <input
                    className="field"
                    placeholder={t.postcode}
                    inputMode="numeric"
                    maxLength={5}
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  />
                  <p className="mt-1.5 text-xs text-muted">{t.postcodeHint}</p>
                </div>
              )}
            </div>

            <p className="mt-2 text-xs text-muted">{t.deliveryNote}</p>
          </section>
        )}

        <section>
          <p className="label">{t.payment}</p>
          <div className="mt-4 space-y-2">
            <label
              className={`flex cursor-pointer items-center gap-3 border px-3.5 py-3 text-sm transition-colors ${
                form.paymentMethod === 'card' ? 'border-ink' : 'border-flax hover:border-muted'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={form.paymentMethod === 'card'}
                onChange={() => set('paymentMethod')('card')}
                className="accent-ink"
              />
              {t.card}
            </label>

            {codAllowed && (
              <label
                className={`flex cursor-pointer items-center gap-3 border px-3.5 py-3 text-sm transition-colors ${
                  form.paymentMethod === 'cod' ? 'border-ink' : 'border-flax hover:border-muted'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={form.paymentMethod === 'cod'}
                  onChange={() => set('paymentMethod')('cod')}
                  className="accent-ink"
                />
                {t.cod}
              </label>
            )}
          </div>
          {form.paymentMethod === 'cod' && (
            <p className="mt-2 text-xs text-muted">
              {t.codNote}
            </p>
          )}
        </section>

        <section>
          <p className="label">{t.comment}</p>
          <textarea
            rows={3}
            className="field mt-4 resize-none"
            placeholder={t.commentPlaceholder}
            value={form.comment}
            onChange={(e) => set('comment')(e.target.value)}
          />

          {/*
            Галочка знята за замовчуванням — згода має бути дією, а не
            наслідком неуважності. Без неї покупець отримає лише листи про
            власне замовлення, і нічого більше.
          */}
          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[13px] leading-[19.5px] text-muted">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-ink"
              checked={form.newsletter}
              onChange={(e) => setForm((prev) => ({ ...prev, newsletter: e.target.checked }))}
            />
            {t.newsletter}
          </label>
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-flax p-6">
          <p className="label">{t.order}</p>

          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.key} className="flex justify-between gap-4 text-sm">
                <span>
                  {item.title}
                  {item.variantLabel && <span className="text-muted"> · {item.variantLabel}</span>}
                  {item.quantity > 1 && <span className="text-muted"> × {item.quantity}</span>}
                </span>
                <span className="price shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-flax pt-5">
            <label htmlFor="promo" className="label">
              {t.promo}
            </label>
            <input
              id="promo"
              className="field mt-2 uppercase"
              placeholder={t.promoPlaceholder}
              value={form.promoCode}
              onChange={(e) => set('promoCode')(e.target.value)}
            />
          </div>

          <div className="mt-5 flex items-baseline justify-between border-t border-flax pt-5">
            <span className="label">{t.toPay}</span>
            <span className="price text-lg text-brass">{formatPrice(total)}</span>
          </div>

          {error && <p className="mt-4 border border-brass/40 bg-brass/5 px-3 py-2 text-xs text-ink">{error}</p>}

          <button type="submit" disabled={busy} className="btn btn-primary mt-5 w-full">
            {busy ? t.submitting : t.submit}
          </button>

          <p className="mt-3 text-center text-[0.6875rem] leading-relaxed text-muted">
            {t.terms}{' '}
            <Link href="/offer" className="underline underline-offset-2">
              {t.termsLink}
            </Link>
          </p>
        </div>
      </aside>
    </form>
  )
}
