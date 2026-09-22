import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { imageAlt, imageUrl } from '@/lib/media'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

const findPage = async (slug: string) => {
  const payload = await payloadClient()
  const locale = await getLocale()
  const result = await payload.find({ locale,
    collection: 'pages',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
  })
  return result.docs[0] ?? null
}

export const generateMetadata = async ({ params }: { params: Params }): Promise<Metadata> => {
  const { slug } = await params
  const page = await findPage(slug)
  if (!page) return {}
  // Картинка для соцмереж: своя для сторінки, інакше обкладинка, інакше та,
  // що задана для всього сайту в «Налаштуваннях».
  const image = imageUrl(page.ogImage, 'wide') ?? imageUrl(page.cover, 'wide')

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.intro || undefined,
    ...(image ? { openGraph: { images: [image] } } : {}),
  }
}

/**
 * Статичні сторінки з адмінки: про бренд, доставка й оплата, оферта.
 * Свідомо останній маршрут — усі конкретні шляхи (/shop, /courses…) мають
 * пріоритет, сюди потрапляє тільки те, що не збіглося з ними.
 */
const StaticPage = async ({ params }: { params: Params }) => {
  const { slug } = await params
  const page = await findPage(slug)
  if (!page) notFound()

  const cover = imageUrl(page.cover, 'wide')

  return (
    <article className="page-y">
      <header className="shell max-w-3xl">
        <h1 className="text-page">{page.title}</h1>
        {page.intro && <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">{page.intro}</p>}
      </header>

      {cover && (
        <div className="shell mt-12">
          <div className="relative aspect-16/7 overflow-hidden bg-paper-deep">
            <Image
              src={cover}
              alt={imageAlt(page.cover, page.title)}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
      )}

      {page.content && (
        <div className="shell mt-12 max-w-3xl text-[0.9375rem] leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h3]:mt-8 [&_h3]:text-lg [&_li]:mt-1.5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5">
          <RichText data={page.content} />
        </div>
      )}
    </article>
  )
}

export default StaticPage
