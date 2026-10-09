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
      Оптимізатор Next вимкнено — і це не компроміс, а прибирання зайвого.

      Розміри нам дає Payload: при завантаженні він ріже кожне фото на
      thumbnail 320, card 640, wide 1280 і hero 2000, усе вже у WebP (див.
      collections/Media.ts). Потрібний варіант вибирає imageUrl() ще до
      рендера. Оптимізатору лишалося взяти готовий WebP і стиснути його
      ВДРУГЕ — саме через це зникали бісер і нитки, на що скаржилася
      клієнтка, і саме тому тут раніше стояла якість 90 замість типових 75.

      9 жовтня це перестало бути питанням смаку: на Vercel скінчився місячний
      ліміт перетворень, /_next/image почав віддавати 402
      OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED, і на сайті зникли ВСІ фото,
      хоч самі файли лежали цілі. Платити за друге стиснення того, що вже
      стиснуте, — найгірший з можливих варіантів.

      Тепер <Image> віддає посилання Payload як є. Ліміту немає, бо немає й
      перетворень. Властивість quality у компонентів лишається без дії —
      прибирати її з двадцяти місць не варто, вона нікому не заважає.

      Ціна: немає srcset, тож телефон тягне той самий файл, що й десктоп.
      Для карток це 640 px, для героїв 2000 px (~350 КБ). Якщо колись стане
      важко — не вмикати оптимізатор назад, а навчити imageUrl() віддавати
      card на вузьких екранах.
    */
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
