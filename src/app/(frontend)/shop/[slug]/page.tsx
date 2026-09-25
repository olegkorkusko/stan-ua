import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { notFound } from 'next/navigation'

import { ProductCard } from '@/components/site/ProductCard'
import { MediaGallery } from '@/components/site/MediaGallery'
import { JsonLd, productSchema } from '@/components/site/JsonLd'
import { ProductPurchase, type PurchaseVariant } from '@/components/site/ProductPurchase'
import { Reviews } from '@/components/site/Reviews'
import { formatPrice } from '@/lib/format'
import { imageAlt, imageUrl } from '@/lib/media'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'
import { savedItems } from '@/lib/saved'
import type { Product } from '@/payload-types'
import { SectionTitle } from '@/components/site/Typography'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

const findProduct = async (slug: string) => {
  const payload = await payloadClient()
  const locale = await getLocale()
  const result = await payload.find({
    locale,
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

const CRUMB_CLASS =
  'text-eyebrow uppercase text-muted transition-colors hover:text-ink active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2'

const ProductPage = async ({ params }: { params: Params }) => {
  const { slug } = await params
  const product = await findProduct(slug)
  if (!product) notFound()

  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)
  const category = typeof product.category === 'object' ? product.category : null
  const categoryId =
    category?.id ?? (typeof product.category === 'number' ? product.category : null)

  const [related, reviews] = await Promise.all([
    categoryId
      ? payload.find({
          locale,
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
    payload.find({
      locale,
      collection: 'reviews',
      where: { status: { equals: 'approved' }, product: { equals: product.id } },
      limit: 20,
      depth: 0,
      sort: '-createdAt',
    }),
  ])

  const saved = await savedItems()

  // Склад набору: з depth 2 сюди приходять самі товари, а не їхні числа.
  const kitItems = (product.kitItems ?? []).filter(
    (item): item is Product => typeof item === 'object' && item !== null,
  )

  const images = Array.isArray(product.images) ? product.images : []
  const galleryImages = images
    .map((item) => ({ src: imageUrl(item, 'wide'), alt: imageAlt(item, product.title) }))
    .filter((item): item is { src: string; alt: string } => Boolean(item.src))

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
    ? Math.round(
        (reviews.docs.reduce((sum, review) => sum + review.rating, 0) / ratingCount) * 10,
      ) / 10
    : 0

  const terms = [
    {
      key: '75:1387',
      titleId: '75:1388',
      valueId: '75:1389',
      title: t.product.delivery,
      value: t.product.deliveryValue,
    },
    {
      key: '75:1390',
      titleId: '75:1391',
      valueId: '75:1392',
      title: t.product.payment,
      value: t.product.paymentValue,
    },
    {
      key: '75:1393',
      titleId: '75:1394',
      valueId: '75:1395',
      title: t.product.madeBy,
      value: t.product.madeByValue,
    },
  ]

  return (
    /*
      Без верхнього відступу: у макеті кадр «Товар» (72:1294) починається одразу
      під шапкою й має власний padding-top 34. Зовнішні pt-24/pt-32, що були тут,
      додавали до нього ще 96/128 — сумарно виходило 162 замість 34.
    */
    <div>
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

      {/*
        Кадр «Товар» 72:1294 — БЕЗ бічних відступів: галерея йде в лівий край
        екрана, а свої 64/40 тримає вже права колонка. На мобільному (311:6205)
        так само в край, знизу 56. Через .shell, який тут був, ліва колонка
        виходила 626 замість 720, а фото 583 замість 681.
      */}
      <div
        data-figma-node="72:1294"
        data-figma-state="default"
        className="mx-auto flex w-full max-w-360 flex-col gap-9 pb-14 md:pt-8.5 md:pb-30"
      >
        <div data-figma-node="72:1299" className="flex flex-col gap-10 lg:flex-row lg:gap-0">
          {/* Ліва колонка — 118:2365. Галерея з активним фото + індикатором.
              Рівно половина (720 із 1440), тому w-1/2, а не flex-1: із flex-1
              права колонка не стискалася під свій вміст і забирала 770. */}
          <div data-figma-node="118:2365" className="flex min-w-0 flex-col gap-6 lg:w-1/2">
            <MediaGallery
              images={galleryImages}
              emptyLabel={t.product.gallery}
              nodes={{ frame: '72:1300', photo: '72:1385', dots: '116:2366' }}
            />
          </div>

          {/* Права колонка — 72:1301. Купівля: крихти, назва+ціна, свотчі, розмір,
              наявність, дії, умови. Тримається зверху при прокручуванні на lg+. */}
          {/* Бічні 16 на мобільному — свої: контейнера сторінки більше немає,
              а фото в макеті йде в край, тоді як текст має відступ. */}
          <div
            data-figma-node="72:1301"
            className="flex min-w-0 flex-col gap-9 px-4 lg:w-1/2 lg:px-0 lg:pt-18 lg:pl-16 lg:pr-10"
          >
            <nav
              data-figma-node="72:1295"
              className="flex items-center gap-2"
              aria-label="Навігація"
            >
              <Link href="/shop" data-figma-node="72:1296" className={CRUMB_CLASS}>
                {t.shop.label.toUpperCase()}
              </Link>
              {category && (
                <>
                  <span data-figma-node="72:1297" className={`${CRUMB_CLASS} pointer-events-none`}>
                    /
                  </span>
                  <Link
                    href={`/shop/catalog?category=${category.slug}`}
                    data-figma-node="72:1298"
                    className={CRUMB_CLASS}
                  >
                    {(category.title ?? '').toUpperCase()}
                  </Link>
                </>
              )}
            </nav>

            <div data-figma-node="73:1374" className="flex flex-col gap-4">
              <SectionTitle as="h1" data-figma-node="73:1375">
                {product.title}
              </SectionTitle>
              {product.shortDescription && (
                <p
                  data-figma-node="73:1376"
                  className="text-[15px] font-normal leading-[24px] text-muted"
                >
                  {product.shortDescription}
                </p>
              )}
              {/*
                Ціна тут така сама, як на сторінці курсу (CourseBuy): 24 px
                латунню. У макеті вона була 17 px чорнилом, і виходило, що та
                сама величина на двох сусідніх сторінках виглядає по-різному —
                на курсі як ціна, на товарі як звичайний рядок тексту.
              */}
              <p data-figma-node="73:1377" className="price text-2xl text-brass">
                {formatPrice(product.priceFrom ?? product.price)}
              </p>
            </div>

            <ProductPurchase
              productId={String(product.id)}
              title={product.title}
              slug={product.slug ?? ''}
              basePrice={product.price}
              baseStock={product.stock ?? 0}
              image={imageUrl(images[0], 'card') ?? undefined}
              variants={variants}
              saved={saved.products.has(product.id)}
              authorized={saved.authorized}
            />

            {/*
              «Докупити до набору» тимчасово прихований на прохання замовника.
              Сам блок нікуди не подівся: компонент KitAddons, поле addons у
              Products і рядки addonsTitle/addonsNote у словнику на місці.

              Щоб повернути — розкоментувати фрагмент нижче й дописати назад
              два імпорти, які без нього стали невживані:
                import { KitAddons } from '@/components/site/KitAddons'
                import type { Product } from '@/payload-types'

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
            */}

            {/*
              Склад набору. Поле «Що входить у набір» заповнювали в адмінці,
              а сторінка його не показувала — покупець бачив ціну набору й не
              знав, за що платить.

              Не плутати з прихованим блоком вище: там апсел «докупити», тут
              те, що вже входить у ціну.
            */}
            {product.isKit && kitItems.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="label">{t.product.kitIncludes}</p>
                <ul className="flex flex-col gap-1 text-[13px] leading-[19.5px] text-muted">
                  {kitItems.map((item) => (
                    <li key={item.id}>
                      <Link href={`/shop/${item.slug}`} className="thread-link text-ink">
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.description && (
              <div className="prose prose-sm max-w-none text-[13px] leading-[19.5px] text-muted">
                <RichText data={product.description} />
              </div>
            )}

            <dl
              data-figma-node="75:1386"
              className="flex flex-col text-[13px] font-normal leading-[19.5px]"
            >
              {terms.map((term, index) => (
                <div
                  key={term.key}
                  data-figma-node={term.key}
                  className={`flex items-baseline justify-between gap-4 border border-[#16150F24] px-0 py-[15px] ${index > 0 ? 'border-t-0' : ''} border-x-0`}
                >
                  <dt data-figma-node={term.titleId} className="font-normal text-muted">
                    {term.title}
                  </dt>
                  <dd data-figma-node={term.valueId} className="font-normal text-ink text-right">
                    {term.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Відгуки — 135:2815. Поза контейнером сторінки навмисно: у макеті це
          смуга #F4F4F4 на всі 1440, а вміст усередині вже в контейнері 1360. */}
      <Reviews reviews={reviews.docs} target={{ product: product.id }} />

      {/*
        «Схоже» — добудова поверх макета: у кадрі сторінки товару (72:1222)
        такої секції немає, там після відгуків одразу підвал. Тому відступи
        беремо з ритму сторінки: 56 знизу на мобільному, 120 на десктопі —
        як у «Товар» і «Відгуки».
      */}
      {related.docs.length > 0 && (
        <section className="shell mt-24 pb-14 md:pb-30">
          <p className="label">{t.product.related}</p>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {related.docs.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                saved={saved.products.has(item.id)}
                authorized={saved.authorized}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ProductPage
