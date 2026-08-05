import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: '/',
    // Кабінет, кошик і службові маршрути в пошуку не потрібні.
    disallow: ['/admin', '/api', '/account', '/checkout', '/search'],
  },
  sitemap: `${base}/sitemap.xml`,
})

export default robots
