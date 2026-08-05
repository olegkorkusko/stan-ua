import type { Metadata } from 'next'
import Image from 'next/image'
import { LocaleLink as Link } from '@/components/site/LocaleLink'

import { imageAlt, imageUrl } from '@/lib/media'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Журнал',
  description: 'Гайди й поради про вʼязання, бісероплетіння та макраме: з чого почати й що купити.',
}

const formatDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  const months = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

const JournalPage = async () => {
  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)
  const posts = await payload.find({ locale,
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 30,
    depth: 1,
  })

  return (
    <div className="shell pb-24 pt-28 md:pt-36">
      <p className="label">{t.journal.label}</p>
      <h1 className="mt-3 max-w-2xl text-[clamp(2rem,4.5vw,3.25rem)]">{t.journal.title}</h1>

      {posts.docs.length === 0 ? (
        <p className="mt-12 text-sm text-muted">{t.journal.empty}</p>
      ) : (
        <div className="mt-14 grid gap-x-6 gap-y-14 md:grid-cols-3">
          {posts.docs.map((post) => {
            const cover = imageUrl(post.cover, 'card')

            return (
              <article key={post.id} className="group">
                <Link href={`/journal/${post.slug}`}>
                  <div className="relative aspect-4/3 overflow-hidden bg-paper-deep">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={imageAlt(post.cover, post.title)}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="weave h-full w-full" />
                    )}
                  </div>

                  {post.publishedAt && <p className="label mt-4">{formatDate(post.publishedAt)}</p>}
                  <h2 className="mt-2 text-xl leading-snug">{post.title}</h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                  )}
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default JournalPage
