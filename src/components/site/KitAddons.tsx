'use client'

import Image from 'next/image'
import { useState } from 'react'

import { formatPrice } from '@/lib/format'
import { useCart } from '@/providers/CartProvider'
import { useLocale } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'

export type Addon = {
  id: string
  title: string
  price: number
  slug: string
  image?: string
  inStock: boolean
}

/**
 * «Іноді людина захоче докупити буквально щось таке дрібне» — блок дозволяє
 * додати дрібниці до набору однією дією, не йдучи в каталог і не питаючи нас.
 */
export const KitAddons = ({ addons }: { addons: Addon[] }) => {
  const { add } = useCart()
  const t = dictionary(useLocale()).product
  const [chosen, setChosen] = useState<string[]>([])

  const available = addons.filter((addon) => addon.inStock)
  if (available.length === 0) return null

  const selected = available.filter((addon) => chosen.includes(addon.id))
  const extra = selected.reduce((sum, addon) => sum + addon.price, 0)

  return (
    <section className="mt-10 border border-flax p-6">
      <p className="label">{t.addonsTitle}</p>
      <p className="mt-2 text-sm text-muted">{t.addonsNote}</p>

      <ul className="mt-5 space-y-3">
        {available.map((addon) => {
          const active = chosen.includes(addon.id)

          return (
            <li key={addon.id}>
              <label className="flex cursor-pointer items-center gap-4">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() =>
                    setChosen((current) =>
                      active ? current.filter((id) => id !== addon.id) : [...current, addon.id],
                    )
                  }
                  className="accent-ink"
                />
                {addon.image ? (
                  <Image
                    src={addon.image}
                    alt={addon.title}
                    width={44}
                    height={55}
                    className="h-14 w-11 object-cover"
                  />
                ) : (
                  <span className="weave h-14 w-11" />
                )}
                <span className="flex-1 text-sm">{addon.title}</span>
                <span className="price text-brass">{formatPrice(addon.price)}</span>
              </label>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        disabled={selected.length === 0}
        onClick={() => {
          for (const addon of selected) {
            add({
              key: `product:${addon.id}:base`,
              kind: 'product',
              id: addon.id,
              title: addon.title,
              price: addon.price,
              image: addon.image,
              href: `/shop/${addon.slug}`,
            })
          }
          setChosen([])
        }}
        className="btn btn-outline mt-5 w-full"
      >
        {selected.length === 0 ? t.addonsEmpty : t.addonsAdd(selected.length, formatPrice(extra))}
      </button>
    </section>
  )
}
