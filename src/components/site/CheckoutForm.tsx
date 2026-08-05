'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { formatPrice } from '@/lib/format'
import { useCart } from '@/providers/CartProvider'

type Suggestion = { label: string; ref: string }

const DELIVERY = [
  { value: 'np_branch', label: 'Нова Пошта — відділення' },
  { value: 'np_locker', label: 'Нова Пошта — поштомат' },
  { value: 'np_courier', label: "Нова Пошта — кур'єр до дверей" },
  { value: 'ukrposhta', label: 'Укрпошта' },
]

/** Підказки адрес з невеликою затримкою, щоб не смикати API на кожну літеру. */
const useSuggestions = (type: 'city' | 'branch', query: string, cityRef?: string) => {
  const [items, setItems] = useState<Suggestion[]>([])
  const [manual, setManual] = useState(false)

  useEffect(() => {
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
  }, [type, query, cityRef])

  return { items, manual }
}

const field =
  'w-full border border-flax bg-paper px-3.5 py-3 text-sm outline-none transition-colors focus:border-ink'

export const CheckoutForm = () => {
  const { items, total, clear } = useCart()
  const formRef = useRef<HTMLFormElement>(null)

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    comment: '',
    promoCode: '',
    deliveryMethod: 'np_branch',
    paymentMethod: 'card' as 'card' | 'cod',
  })
  const [city, setCity] = useState({ label: '', ref: '' })
  const [branch, setBranch] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [branchQuery, setBranchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const hasPhysical = items.some((item) => item.kind === 'product')
  const hasCourse = items.some((item) => item.kind === 'course')
  const codAllowed = hasPhysical && !hasCourse

  const cities = useSuggestions('city', cityQuery)
  const branches = useSuggestions('branch', branchQuery, city.ref)

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          paymentMethod: codAllowed ? form.paymentMethod : 'card',
          deliveryCity: hasPhysical ? city.label || cityQuery : undefined,
          deliveryBranch: hasPhysical ? branch || branchQuery : undefined,
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
        <p className="text-sm text-muted">Кошик порожній.</p>
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
          <p className="label">Контакти</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              className={field}
              placeholder="Імʼя та прізвище"
              value={form.customerName}
              onChange={(e) => set('customerName')(e.target.value)}
            />
            <input
              required
              type="tel"
              className={field}
              placeholder="+380"
              value={form.customerPhone}
              onChange={(e) => set('customerPhone')(e.target.value)}
            />
            <input
              required
              type="email"
              className={`${field} sm:col-span-2`}
              placeholder="Пошта — на неї прийде доступ"
              value={form.customerEmail}
              onChange={(e) => set('customerEmail')(e.target.value)}
            />
          </div>
          {hasCourse && (
            <p className="mt-2 text-xs text-muted">
              Доступ до курсу приходить на пошту одразу після оплати. Перевірте адресу.
            </p>
          )}
        </section>

        {hasPhysical && (
          <section>
            <p className="label">Доставка</p>
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
                  className={field}
                  placeholder="Місто"
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
                  className={field}
                  placeholder={
                    form.deliveryMethod === 'np_courier' ? 'Вулиця, будинок, квартира' : 'Відділення або поштомат'
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
            </div>

            <p className="mt-2 text-xs text-muted">Доставка за тарифами перевізника.</p>
          </section>
        )}

        <section>
          <p className="label">Оплата</p>
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
              Карткою онлайн · Apple Pay · Google Pay
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
                Накладений платіж із передплатою
              </label>
            )}
          </div>
          {form.paymentMethod === 'cod' && (
            <p className="mt-2 text-xs text-muted">
              Зараз сплачуєте передплату, решту — при отриманні на пошті.
            </p>
          )}
        </section>

        <section>
          <p className="label">Коментар</p>
          <textarea
            rows={3}
            className={`${field} mt-4 resize-none`}
            placeholder="Побажання до замовлення"
            value={form.comment}
            onChange={(e) => set('comment')(e.target.value)}
          />
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-flax p-6">
          <p className="label">Замовлення</p>

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
              Промокод
            </label>
            <input
              id="promo"
              className={`${field} mt-2 uppercase`}
              placeholder="Якщо є"
              value={form.promoCode}
              onChange={(e) => set('promoCode')(e.target.value)}
            />
          </div>

          <div className="mt-5 flex items-baseline justify-between border-t border-flax pt-5">
            <span className="label">До сплати</span>
            <span className="price text-lg text-brass">{formatPrice(total)}</span>
          </div>

          {error && <p className="mt-4 border border-brass/40 bg-brass/5 px-3 py-2 text-xs text-ink">{error}</p>}

          <button type="submit" disabled={busy} className="btn btn-primary mt-5 w-full">
            {busy ? 'Готуємо оплату…' : 'Перейти до оплати'}
          </button>

          <p className="mt-3 text-center text-[0.6875rem] leading-relaxed text-muted">
            Натискаючи кнопку, ви приймаєте умови{' '}
            <Link href="/offer" className="underline underline-offset-2">
              публічної оферти
            </Link>
          </p>
        </div>
      </aside>
    </form>
  )
}
