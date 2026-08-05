import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CourseCard } from '@/components/site/CourseCard'
import { ProductCard } from '@/components/site/ProductCard'
import { imageAlt, imageUrl } from '@/lib/media'
import { payloadClient } from '@/lib/payload'
import type { Course, Product } from '@/payload-types'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

const findPost = async (slug: string) => {
  const payload = await payloadClient()
  const result = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] ?? null
}

export const generateMetadata = async ({ params }: { params: Params }): Promise<Metadata> => {
  const { slug } = await params
  const post = await findPost(slug)
  if (!post) return {}
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    openGraph: { type: 'article', publishedTime: post.publishedAt ?? undefined },
  }
}

const PostPage = async ({ params }: { params: Params }) => {
  const { slug } = await params
  const post = await findPost(slug)
  if (!post) notFound()

  const cover = imageUrl(post.cover, 'hero')
  const products = (post.relatedProducts ?? []).filter((item): item is Product => typeof item === 'object')
  const courses = (post.relatedCourses ?? []).filter((item): item is Course => typeof item === 'object')

  return (
    <article className="pb-24 pt-28 md:pt-36">
      <header className="shell max-w-3xl">
        <Link href="/journal" className="label hover:text-ink">
          Журнал
        </Link>
        <h1 className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)]">{post.title}</h1>
        {post.excerpt && <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">{post.excerpt}</p>}
      </header>

      {cover && (
        <div className="shell mt-12">
          <div className="relative aspect-16/7 overflow-hidden bg-paper-deep">
            <Image
              src={cover}
              alt={imageAlt(post.cover, post.title)}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
      )}

      {post.content && (
        <div className="shell mt-12 max-w-3xl text-[0.9375rem] leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-flax [&_blockquote]:pl-5 [&_h2]:mt-10 [&_h2]:text-2xl [&_h3]:mt-8 [&_h3]:text-lg [&_li]:mt-1.5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5">
          <RichText data={post.content} />
        </div>
      )}

      {products.length > 0 && (
        <section className="shell mt-20">
          <p className="label">Зі статті</p>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {courses.length > 0 && (
        <section className="shell mt-20">
          <p className="label">Навчитись</p>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                directionSlug={typeof course.direction === 'object' ? (course.direction?.slug ?? '') : ''}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

export default PostPage
