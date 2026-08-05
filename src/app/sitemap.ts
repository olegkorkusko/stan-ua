import type { MetadataRoute } from 'next'

import { payloadClient } from '@/lib/payload'

const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const payload = await payloadClient()

  const [products, directions, courses, pages, posts] = await Promise.all([
    payload.find({ collection: 'products', where: { status: { equals: 'published' } }, limit: 500, depth: 0 }),
    payload.find({ collection: 'course-directions', limit: 50, depth: 0 }),
    payload.find({ collection: 'courses', where: { status: { equals: 'published' } }, limit: 200, depth: 1 }),
    payload.find({ collection: 'pages', where: { status: { equals: 'published' } }, limit: 100, depth: 0 }),
    payload.find({ collection: 'posts', where: { status: { equals: 'published' } }, limit: 300, depth: 0 }),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/courses`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/journal`, changeFrequency: 'weekly', priority: 0.6 },
  ]

  return [
    ...staticRoutes,
    ...products.docs.map((doc) => ({
      url: `${base}/shop/${doc.slug}`,
      lastModified: doc.updatedAt,
      priority: 0.8,
    })),
    ...directions.docs.map((doc) => ({
      url: `${base}/courses/${doc.slug}`,
      lastModified: doc.updatedAt,
      priority: 0.7,
    })),
    ...courses.docs.map((doc) => ({
      url: `${base}/courses/${typeof doc.direction === 'object' ? doc.direction?.slug : ''}/${doc.slug}`,
      lastModified: doc.updatedAt,
      priority: 0.8,
    })),
    ...pages.docs.map((doc) => ({ url: `${base}/${doc.slug}`, lastModified: doc.updatedAt, priority: 0.4 })),
    ...posts.docs.map((doc) => ({
      url: `${base}/journal/${doc.slug}`,
      lastModified: doc.updatedAt,
      priority: 0.6,
    })),
  ]
}

export default sitemap
