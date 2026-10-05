import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next віддає 403 на клієнтські чанки, якщо dev-сервер відкрити з адреси,
  // якої немає в списку. Без цього сайт рендериться, але не «оживає»:
  // кошик і вибір варіацій мовчать.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  // Індикатор «N» унизу перекривається з портал-splash і бʼється з figma-parity.
  devIndicators: false,
  // Мітки для figma-parity. Гейти шукають їх у DOM, тож у dev і в тому білді,
  // проти якого вони бігають, атрибути мусять лишатися. Next застосовує
  // reactRemoveProperties до будь-якого білду (вимикає лише під jest), тому
  // прод-режим вмикаємо самі, з виходом для CI: PARITY_KEEP_TAGS=1.
  compiler: {
    reactRemoveProperties:
      process.env.NODE_ENV === 'production' && !process.env.PARITY_KEEP_TAGS
        ? { properties: ['^data-figma-', '^data-interaction-exempt$'] }
        : false,
  },
  images: {
    /*
      Якість оптимізованих зображень.

      Типові 75 — це ДРУГЕ стиснення поверх першого: Payload уже зберіг файл
      у WebP, а оптимізатор тисне його ще раз. На фото прикрас це помітно
      одразу — зникає бісер, нитки, сітка.

      90 для великих кадрів фактично прибирає друге стиснення: коли вихідний
      файл менший за потрібний розмір, Next віддає його як є. 85 — для
      карток у каталозі, де їх по двадцять на екран і вага важить.
    */
    qualities: [75, 85, 90],
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
