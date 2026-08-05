import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next віддає 403 на клієнтські чанки, якщо dev-сервер відкрити з адреси,
  // якої немає в списку. Без цього сайт рендериться, але не «оживає»:
  // кошик і вибір варіацій мовчать.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
