'use client'

import type { ReactNode } from 'react'

import { formatPrice } from '@/lib/format'
import { useCart } from '@/providers/CartProvider'
import { useLocale } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'

type Props = {
  courseId: string
  title: string
  href: string
  price: number
  oldPrice?: number | null
  image?: string
  /**
   * Серце «Обране» — стає в один рядок із кнопкою купівлі, як на сторінці
   * товару (148:3561). Приходить ззовні, бо стан «збережено» читається на
   * сервері, а цей компонент клієнтський.
   */
  save?: ReactNode
}

/**
 * Курс купується в два кліки: «Купити» кладе в кошик і одразу веде на
 * оформлення. Це головне, заради чого робився сайт — щоб не пересилати
 * реквізити руками.
 */
export const CourseBuy = ({ courseId, title, href, price, oldPrice, image, save }: Props) => {
  const { add } = useCart()
  const t = dictionary(useLocale()).courses

  return (
    <div className="border border-flax bg-paper p-6">
      <div className="flex items-baseline gap-3">
        <span className="price text-2xl text-brass">{formatPrice(price)}</span>
        {oldPrice ? <span className="text-sm text-muted line-through">{formatPrice(oldPrice)}</span> : null}
      </div>

      {/* Кнопка й серце — в один рядок, як на товарі. */}
      <div className="mt-5 flex items-stretch gap-2">
        <button
          type="button"
          onClick={() =>
            add({
              key: `course:${courseId}`,
              kind: 'course',
              id: courseId,
              title,
              price,
              image,
              href,
            })
          }
          className="btn btn-primary w-full flex-1"
        >
          {t.buy}
        </button>
        {save}
      </div>

      {/* list-disc явно: Tailwind у preflight скидає маркери всім спискам,
          тож <ul> без нього виглядає як звичайні рядки. */}
      <ul className="mt-5 list-disc space-y-2 pl-4 text-xs leading-relaxed text-muted marker:text-ink/40">
        {t.perks.map((perk) => (
          <li key={perk}>{perk}</li>
        ))}
      </ul>
    </div>
  )
}
