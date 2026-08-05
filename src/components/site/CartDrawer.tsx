'use client'

import { Minus, Plus, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'

import { formatPrice } from '@/lib/format'
import { useCart } from '@/providers/CartProvider'

export const CartDrawer = () => {
  const { items, total, isOpen, close, remove, setQuantity } = useCart()

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close])

  return (
    <div className={`fixed inset-0 z-70 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Закрити кошик"
        onClick={close}
        className={`absolute inset-0 bg-ink/30 transition-opacity duration-400 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute inset-y-0 right-0 flex w-[min(26rem,92vw)] flex-col bg-paper transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Кошик"
      >
        <div className="flex h-16 items-center justify-between border-b border-flax px-5">
          <span className="label">Кошик</span>
          <button type="button" onClick={close} aria-label="Закрити кошик" className="p-1">
            <X strokeWidth={1.25} size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="weave h-24 w-24 rounded-full opacity-60" />
            <p className="text-sm text-muted">Тут поки порожньо.</p>
            <Link href="/courses" className="btn btn-outline" onClick={close}>
              Обрати курс
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-flax overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5">
                  <Link href={item.href} onClick={close} className="shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={80}
                        height={100}
                        className="h-25 w-20 object-cover"
                      />
                    ) : (
                      <div className="weave h-25 w-20" />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={item.href} onClick={close} className="text-sm leading-snug">
                      {item.title}
                    </Link>
                    {item.variantLabel && (
                      <span className="mt-0.5 text-xs text-muted">{item.variantLabel}</span>
                    )}
                    {item.kind === 'course' && (
                      <span className="mt-0.5 text-xs text-muted">Доступ назавжди</span>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-3">
                      {item.kind === 'course' ? (
                        <button
                          type="button"
                          onClick={() => remove(item.key)}
                          className="text-xs text-muted underline underline-offset-4"
                        >
                          Прибрати
                        </button>
                      ) : (
                        <div className="flex items-center border border-flax">
                          <button
                            type="button"
                            onClick={() => setQuantity(item.key, item.quantity - 1)}
                            className="px-2 py-1.5"
                            aria-label="Менше"
                          >
                            <Minus size={13} strokeWidth={1.5} />
                          </button>
                          <span className="min-w-6 text-center text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.key, item.quantity + 1)}
                            className="px-2 py-1.5 disabled:opacity-30"
                            disabled={item.quantity >= (item.maxQuantity ?? Infinity)}
                            aria-label="Більше"
                          >
                            <Plus size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                      )}
                      <span className="price text-brass">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-flax px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="label">Разом</span>
                <span className="price text-base">{formatPrice(total)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">Вартість доставки рахується на наступному кроці.</p>
              <Link href="/checkout" onClick={close} className="btn btn-primary mt-4 w-full">
                Оформити
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
