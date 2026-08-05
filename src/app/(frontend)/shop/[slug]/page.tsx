import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { notFound } from 'next/navigation'

import { ProductCard } from '@/components/site/ProductCard'
import { JsonLd, productSchema } from '@/components/site/JsonLd'
import { KitAddons } from '@/components/site/KitAddons'
import { ProductPurchase, type PurchaseVariant } from '@/components/site/ProductPurchase'
import { Reviews } from '@/components/site/Reviews'
import { imageAlt, imageUrl } from '@/lib/media'
import type { Product } from '@/payload-types'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

const findProduct = async (slug: string) => {
  const payload = await payloadClient()
  const locale = await getLocale()
  const result = await payload.find({ locale,
    collection: 'products',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] ?? null
}

export const generateMetadata = async ({ params }: { params: Params }): Promise<Metadata> => {
  const { slug } = await params
  const product = await findProduct(slug)
  if (!product) return {}
  return {
    title: product.title,
    description: product.shortDescription ?? undefined,
  }
}

const ProductPage = async ({ params }: { params: Params }) => {
  const { slug } = await params
  const product = await findProduct(slug)
  if (!product) notFound()

  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)
  const categoryId = typeof product.category === 'object' ? product.category?.id : product.category

  const [related, reviews] = await Promise.all([
    categoryId
      ? payload.find({ locale,
          collection: 'products',
          where: {
            status: { equals: 'published' },
            category: { equals: categoryId },
            id: { not_equals: product.id },
          },
          limit: 4,
          depth: 2,
        })
      : Promise.resolve({ docs: [] }),
    payload.find({ locale,
      collection: 'reviews',
      where: { status: { equals: 'approved' }, product: { equals: product.id } },
      limit: 20,
      depth: 0,
      sort: '-createdAt',
    }),
  ])

  const images = Array.isArray(product.images) ? product.images : []

  const variants: PurchaseVariant[] = (product.variants ?? []).map((variant, index) => {
    const color = typeof variant.color === 'object' ? variant.color : null
    const size = typeof variant.size === 'object' ? variant.size : null
    return {
      id: variant.id ?? String(index),
      colorId: color ? String(color.id) : undefined,
      colorTitle: color?.title,
      colorHex: color?.hex,
      sizeId: size ? String(size.id) : undefined,
      sizeTitle: size?.title,
      price: variant.price ?? product.price,
      stock: variant.stock ?? 0,
      image: imageUrl(variant.image, 'card') ?? undefined,
    }
  })

  const ratingCount = reviews.docs.length
  const ratingValue = ratingCount
    ? Math.round((reviews.docs.reduce((sum, review) => sum + review.rating, 0) / ratingCount) * 10) / 10
    : 0

  return (
    <div className="pb-24 pt-24 md:pt-32">
      <JsonLd
        data={productSchema({
          name: product.title,
          description: product.shortDescription,
          image: imageUrl(images[0], 'wide'),
          price: product.priceFrom ?? product.price,
          inStock: Boolean(product.inStock),
          url: `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/shop/${product.slug}`,
          rating: ratingCount ? { value: ratingValue, count: ratingCount } : null,
        })}
      />
      <div className="shell">
        <nav className="label mb-8 flex gap-2" aria-label="Навігація">
          <Link href="/shop" className="hover:text-ink">
            {t.shop.label}
          </Link>
          {typeof product.category === 'object' && product.category && (
            <>
              <span aria-hidden>/</span>
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-ink">
                {product.category.title}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div className="grid gap-3 sm:grid-cols-2">
            {images.length > 0 ? (
              images.map((media, index) => {
                const url = imageUrl(media, 'wide')
                return url ? (
                  <div
                    key={index}
                    className={`relative aspect-4/5 overflow-hidden bg-paper-deep ${
                      images.length === 1 ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <Image
                      src={url}
                      alt={imageAlt(media, product.title)}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      className="object-cover"
                    />
                  </div>
                ) : null
              })
            ) : (
              <div className="weave aspect-4/5 sm:col-span-2" />
            )}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <h1 className="text-[clamp(1.75rem,3vw,2.5rem)]">{product.title}</h1>
            {product.shortDescription && (
              <p className="mt-3 text-sm leading-relaxed text-muted">{product.shortDescription}</p>
            )}

            <ProductPurchase
              productId={String(product.id)}
              title={product.title}
              slug={product.slug ?? ''}
              basePrice={product.price}
              baseStock={product.stock ?? 0}
              image={imageUrl(images[0], 'card') ?? undefined}
              variants={variants}
            />

            {product.isKit && (
              <KitAddons
                addons={(product.addons ?? [])
                  .filter((addon): addon is Product => typeof addon === 'object')
                  .map((addon) => ({
                    id: String(addon.id),
                    title: addon.title,
                    price: addon.priceFrom ?? addon.price,
                    slug: addon.slug ?? '',
                    image: imageUrl(Array.isArray(addon.images) ? addon.images[0] : null, 'thumbnail') ?? undefined,
                    inStock: Boolean(addon.inStock),
                  }))}
              />
            )}

            {product.description && (
              <div className="prose prose-sm mt-10 max-w-none text-sm leading-relaxed text-muted">
                <RichText data={product.description} />
              </div>
            )}

            <dl className="mt-10 divide-y divide-flax border-t border-flax text-sm">
              <div className="flex justify-between py-3">
                <dt className="text-muted">{t.product.delivery}</dt>
                <dd>{t.product.deliveryValue}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-muted">{t.product.payment}</dt>
                <dd>{t.product.paymentValue}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-muted">{t.product.madeBy}</dt>
                <dd>{t.product.madeByValue}</dd>
              </div>
            </dl>
          </div>
        </div>

        <Reviews reviews={reviews.docs} target={{ product: product.id }} />
      </div>

      {related.docs.length > 0 && (
        <section className="shell mt-24">
          <p className="label">{t.product.related}</p>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {related.docs.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ProductPage
