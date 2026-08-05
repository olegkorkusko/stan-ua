import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ProductCard } from '@/components/site/ProductCard'
import { ProductPurchase, type PurchaseVariant } from '@/components/site/ProductPurchase'
import { imageAlt, imageUrl } from '@/lib/media'
import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

const findProduct = async (slug: string) => {
  const payload = await payloadClient()
  const result = await payload.find({
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
  const categoryId = typeof product.category === 'object' ? product.category?.id : product.category

  const related = categoryId
    ? await payload.find({
        collection: 'products',
        where: {
          status: { equals: 'published' },
          category: { equals: categoryId },
          id: { not_equals: product.id },
        },
        limit: 4,
        depth: 2,
      })
    : { docs: [] }

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

  return (
    <div className="pb-24 pt-24 md:pt-32">
      <div className="shell">
        <nav className="label mb-8 flex gap-2" aria-label="Навігація">
          <Link href="/shop" className="hover:text-ink">
            Магазин
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

            {product.description && (
              <div className="prose prose-sm mt-10 max-w-none text-sm leading-relaxed text-muted">
                <RichText data={product.description} />
              </div>
            )}

            <dl className="mt-10 divide-y divide-flax border-t border-flax text-sm">
              <div className="flex justify-between py-3">
                <dt className="text-muted">Доставка</dt>
                <dd>Нова Пошта, Укрпошта</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-muted">Оплата</dt>
                <dd>Картка, Apple Pay, Google Pay</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-muted">Виготовлення</dt>
                <dd>Ручна робота</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {related.docs.length > 0 && (
        <section className="shell mt-24">
          <p className="label">Схоже</p>
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
