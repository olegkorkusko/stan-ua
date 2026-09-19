'use client'

import { useMemo, useState } from 'react'

import { formatPrice } from '@/lib/format'
import { useCart } from '@/providers/CartProvider'
import { useLocale } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'
import { SaveButton } from '@/components/site/SaveButton'

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
  /** Стан «в обраному» — читається на сервері, щоб серце не блимало. */
  saved?: boolean
  authorized?: boolean
  title: string
  slug: string
  basePrice: number
  baseStock: number
  image?: string
  variants: PurchaseVariant[]
}

const LABEL_MUTED_CLASS =
  'text-eyebrow uppercase text-muted'

export const ProductPurchase = ({
  productId,
  saved = false,
  authorized = false,
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
  const stock = hasVariants ? (variant?.stock ?? 0) : baseStock
  const available = stock > 0

  const label = [variant?.colorTitle, variant?.sizeTitle].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col gap-8">
      {colors.length > 0 && (
        <div data-figma-node="74:1374" className="flex flex-col gap-3">
          <div data-figma-node="74:1375" className="flex items-baseline gap-2.5">
            <span data-figma-node="74:1376" className={LABEL_MUTED_CLASS}>
              {t.color.toUpperCase()}
            </span>
            {variant?.colorTitle && (
              <span
                data-figma-node="74:1377"
                className="text-[13px] font-normal leading-[19.5px] text-ink"
              >
                {variant.colorTitle}
              </span>
            )}
          </div>
          <div data-figma-node="125:2720" className="flex flex-wrap gap-1.5">
            {colors.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setColorId(color.id)}
                title={color.title}
                aria-label={color.title}
                aria-pressed={colorId === color.id}
                className={`flex h-[26px] w-[26px] items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  colorId === color.id ? 'ring-1 ring-ink' : ''
                }`}
              >
                <span
                  className="block h-5 w-5 rounded-full ring-1 ring-flax"
                  style={{ background: color.hex }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div data-figma-node="75:1374" className="flex flex-col gap-3.5">
          <span data-figma-node="75:1375" className={LABEL_MUTED_CLASS}>
            {t.size.toUpperCase()}
          </span>
          <div data-figma-node="75:1376" className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => setSizeId(size.id)}
                disabled={size.stock === 0}
                aria-pressed={activeSizeId === size.id}
                className={`flex h-11 w-[52px] items-center justify-center text-[15px] leading-[24px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:text-muted/50 disabled:line-through ${
                  activeSizeId === size.id
                    ? 'bg-ink text-paper'
                    : 'border border-flax text-ink hover:border-ink active:opacity-70'
                }`}
              >
                {size.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <p data-figma-node="75:1383" className="text-[13px] font-normal leading-[19.5px] text-muted">
        {available ? (stock <= 3 ? t.lastLeft(stock) : `${t.inStock} — ${stock} шт`) : t.outOfStock}
      </p>

      <div data-figma-node="148:3561" className="flex gap-2">
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
              color: variant?.colorTitle || undefined,
              size: variant?.sizeTitle || undefined,
              price: variant?.price ?? basePrice,
              image: variant?.image ?? image,
              href: `/shop/${slug}`,
              maxQuantity: stock,
            })
          }
          data-figma-node="75:1384"
          className="flex flex-1 items-center justify-center rounded-[2px] bg-ink px-8 py-[15px] text-[12px] font-semibold uppercase leading-[14.4px] tracking-[0.16em] text-paper transition-colors hover:bg-indigo active:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span data-figma-node="I75:1384;10:13">
            {(available ? t.addToCart : t.outOfStock.split('.')[0]).toUpperCase()}
          </span>
        </button>
        {/* Серце тут раніше було намальоване, але мертве: ні обробника, ні
            стану. Тепер це той самий компонент, що на картках. */}
        <SaveButton
          target={{ product: Number(productId) }}
          initialSaved={saved}
          authorized={authorized}
          variant="boxed"
        />
      </div>
    </div>
  )
}
