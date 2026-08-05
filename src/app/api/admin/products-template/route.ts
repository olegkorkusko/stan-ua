import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

/**
 * Шаблон таблиці для завантаження товарів. Віддається з реальними назвами
 * категорій, кольорів і розмірів із бази — інакше при заповненні доводиться
 * вгадувати, як саме вони записані.
 *
 * BOM на початку потрібен, щоб Excel відкрив українські назви без «кракозябр».
 */
export const GET = async () => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })

  if (user?.collection !== 'users') {
    return NextResponse.json({ error: 'Тільки для адміністраторів' }, { status: 403 })
  }

  const [categories, colors, sizes] = await Promise.all([
    payload.find({ collection: 'categories', limit: 100, depth: 0 }),
    payload.find({ collection: 'colors', limit: 100, depth: 0 }),
    payload.find({ collection: 'sizes', limit: 100, sort: 'order', depth: 0 }),
  ])

  const columns = [
    'Назва',
    'Короткий опис',
    'Ціна',
    'Стара ціна',
    'Категорія',
    'Кольори через кому',
    'Розміри через кому',
    'Залишок на кожну комбінацію',
    'Це набір (так/ні)',
  ]

  const example = [
    'Браслет «Полин»',
    'Ручна робота, регулюється по розміру',
    '420',
    '',
    categories.docs[0]?.title ?? 'Готові прикраси',
    colors.docs.slice(0, 2).map((c) => c.title).join(', ') || 'Молочний, Полин',
    sizes.docs.slice(0, 2).map((s) => s.title).join(', ') || 'S, M',
    '3',
    'ні',
  ]

  const hint = [
    'Заповнюйте з другого рядка. Приклад можна стерти.',
    `Категорії: ${categories.docs.map((c) => c.title).join(' | ') || '—'}`,
    `Кольори: ${colors.docs.map((c) => c.title).join(' | ') || '—'}`,
    `Розміри: ${sizes.docs.map((s) => s.title).join(' | ') || '—'}`,
    '',
    '',
    '',
    '',
    '',
  ]

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const csv = [columns, example, hint].map((row) => row.map(escape).join(';')).join('\r\n')

  return new NextResponse(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mk-tovary-shablon.csv"',
    },
  })
}
