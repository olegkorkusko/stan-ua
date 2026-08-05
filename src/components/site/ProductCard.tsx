import Image from 'next/image'
import Link from 'next/link'

import { formatPrice } from '@/lib/format'
import { imageAlt, imageUrl } from '@/lib/media'
import type { Product } from '@/payload-types'

export const ProductCard = ({ product }: { product: Product }) => {
  const images = Array.isArray(product.images) ? product.images : []
  const primary = imageUrl(images[0], 'card')
  const secondary = imageUrl(images[1], 'card')

  const colors = (product.variants ?? [])
    .map((variant) => (typeof variant.color === 'object' ? variant.color : null))
    .filter((color): color is NonNullable<typeof color> => Boolean(color))
    .filter((color, index, all) => all.findIndex((c) => c.id === color.id) === index)

  return (
    <article className="group">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-4/5 overflow-hidden bg-paper-deep">
          {primary ? (
            <>
              <Image
                src={primary}
                alt={imageAlt(images[0], product.title)}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className={`object-cover transition-opacity duration-500 ${
                  secondary ? 'group-hover:opacity-0' : ''
                }`}
              />
              {secondary && (
                <Image
                  src={secondary}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="weave h-full w-full" />
          )}

          {!product.inStock && (
            <span className="absolute left-3 top-3 bg-paper/90 px-2 py-1 text-[0.625rem] uppercase tracking-[0.16em] text-muted">
              Немає
            </span>
          )}
        </div>

        <div className="mt-3.5 flex items-start justify-between gap-3">
          <h3 className="font-body text-[0.9375rem] font-normal leading-snug tracking-normal">
            {product.title}
          </h3>
          <span className="price shrink-0 text-brass">{formatPrice(product.priceFrom ?? product.price)}</span>
        </div>
      </Link>

      {colors.length > 1 && (
        <div className="mt-2 flex gap-1.5">
          {colors.slice(0, 6).map((color) => (
            <span
              key={color.id}
              title={color.title}
              className="h-2.5 w-2.5 rounded-full ring-1 ring-flax"
              style={{ background: color.hex }}
            />
          ))}
        </div>
      )}
    </article>
  )
}
