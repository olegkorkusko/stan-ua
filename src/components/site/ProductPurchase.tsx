'use client'

import { useMemo, useState } from 'react'

import { formatPrice } from '@/lib/format'
import { useCart } from '@/providers/CartProvider'
import { useLocale } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'

export type PurchaseVariant = {
  id: string
  colorId?: string
  colorTitle?: string
  colorHex?: string
  sizeId?: string
  sizeTitle?: string
  price: number
  stock: number
  image?: string
}

type Props = {
  productId: string
  title: string
  slug: string
  basePrice: number
  baseStock: number
  image?: string
  variants: PurchaseVariant[]
}

export const ProductPurchase = ({
  productId,
  title,
  slug,
  basePrice,
  baseStock,
  image,
  variants,
}: Props) => {
  const { add } = useCart()
  const t = dictionary(useLocale()).product

  const colors = useMemo(() => {
    const seen = new Map<string, { id: string; title: string; hex: string }>()
    for (const variant of variants) {
      if (variant.colorId && !seen.has(variant.colorId)) {
        seen.set(variant.colorId, {
          id: variant.colorId,
          title: variant.colorTitle ?? '',
          hex: variant.colorHex ?? '#000',
        })
      }
    }
    return [...seen.values()]
  }, [variants])

  const [colorId, setColorId] = useState<string | undefined>(colors[0]?.id)

  // Розміри показуємо тільки ті, що існують у вибраному кольорі — щоб покупець
  // не натрапляв на комбінацію, якої не буває.
  const sizes = useMemo(() => {
    const seen = new Map<string, { id: string; title: string; stock: number }>()
    for (const variant of variants) {
      if (colorId && variant.colorId !== colorId) continue
      if (!variant.sizeId) continue
      const current = seen.get(variant.sizeId)
      seen.set(variant.sizeId, {
        id: variant.sizeId,
        title: variant.sizeTitle ?? '',
        stock: (current?.stock ?? 0) + variant.stock,
      })
    }
    return [...seen.values()]
  }, [variants, colorId])

  const [sizeId, setSizeId] = useState<string | undefined>(undefined)
  const activeSizeId = sizeId && sizes.some((s) => s.id === sizeId) ? sizeId : sizes[0]?.id

  const variant = variants.find(
    (v) => (!colorId || v.colorId === colorId) && (!activeSizeId || v.sizeId === activeSizeId),
  )

  const hasVariants = variants.length > 0
  const price = hasVariants ? (variant?.price ?? basePrice) : basePrice
  const stock = hasVariants ? (variant?.stock ?? 0) : baseStock
  const available = stock > 0

  const label = [variant?.colorTitle, variant?.sizeTitle].filter(Boolean).join(' · ')

  return (
    <div>
      <p className="price mt-4 text-lg text-brass">{formatPrice(price)}</p>

      {colors.length > 0 && (
        <div className="mt-8">
          <p className="label">
            {t.color}{variant?.colorTitle ? <span className="ml-2 normal-case text-ink">{variant.colorTitle}</span> : null}
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {colors.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setColorId(color.id)}
                title={color.title}
                aria-label={color.title}
                aria-pressed={colorId === color.id}
                className={`h-7 w-7 rounded-full ring-1 transition-transform hover:scale-105 ${
                  colorId === color.id ? 'ring-ink ring-offset-2' : 'ring-flax'
                }`}
                style={{ background: color.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="mt-7">
          <p className="label">{t.size}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => setSizeId(size.id)}
                disabled={size.stock === 0}
                aria-pressed={activeSizeId === size.id}
                className={`min-w-12 border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:text-muted/50 disabled:line-through ${
                  activeSizeId === size.id ? 'border-ink bg-ink text-paper' : 'border-flax hover:border-ink'
                }`}
              >
                {size.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-muted">
        {available
          ? stock <= 3
            ? t.lastLeft(stock)
            : t.inStock
          : t.outOfStock}
      </p>

      <button
        type="button"
        disabled={!available}
        onClick={() =>
          add({
            key: `product:${productId}:${variant?.id ?? 'base'}`,
            kind: 'product',
            id: productId,
            variantId: variant?.id,
            title,
            variantLabel: label || undefined,
            price,
            image: variant?.image ?? image,
            href: `/shop/${slug}`,
            maxQuantity: stock,
          })
        }
        className="btn btn-primary mt-6 w-full"
      >
        {available ? t.addToCart : t.outOfStock.split('.')[0]}
      </button>
    </div>
  )
}
