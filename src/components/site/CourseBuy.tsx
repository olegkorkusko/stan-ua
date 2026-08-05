'use client'

import { formatPrice } from '@/lib/format'
import { useCart } from '@/providers/CartProvider'

type Props = {
  courseId: string
  title: string
  href: string
  price: number
  oldPrice?: number | null
  image?: string
}

/**
 * Курс купується в два кліки: «Купити» кладе в кошик і одразу веде на
 * оформлення. Це головне, заради чого робився сайт — щоб не пересилати
 * реквізити руками.
 */
export const CourseBuy = ({ courseId, title, href, price, oldPrice, image }: Props) => {
  const { add } = useCart()

  return (
    <div className="border border-flax bg-paper p-6">
      <div className="flex items-baseline gap-3">
        <span className="price text-2xl text-brass">{formatPrice(price)}</span>
        {oldPrice ? <span className="text-sm text-muted line-through">{formatPrice(oldPrice)}</span> : null}
      </div>

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
        className="btn btn-primary mt-5 w-full"
      >
        Купити курс
      </button>

      <ul className="mt-5 space-y-2 text-xs leading-relaxed text-muted">
        <li>Доступ приходить одразу після оплати</li>
        <li>Лишається назавжди, без обмеження за часом</li>
        <li>Оплата карткою, Apple Pay або Google Pay</li>
      </ul>
    </div>
  )
}
