/**
 * Імпорт товарів із заповненої таблиці-шаблону.
 *
 *   npm run import:products -- шлях/до/файлу.csv
 *   npm run import:products -- шлях/до/файлу.csv dry   ← пробний прогін
 *
 * Слово «dry» без рисок — не примха: `payload run` з'їдає аргументи, що
 * починаються з `--`, до скрипта вони не доходять.
 *
 * Шаблон береться в адмінці (кнопка «Шаблон таблиці товарів») або за адресою
 * /api/admin/products-template. Колонки — рівно ті, що в ньому.
 *
 * Скрипт можна запускати повторно: товар із такою самою назвою пропускається,
 * а не дублюється. Кольори, розміри й категорії, яких ще немає, створюються.
 *
 * Фото не імпортуються: їх завантажують в адмінці, бо у файлі їх немає.
 */
import fs from 'fs'
import config from '@payload-config'
import { getPayload } from 'payload'

import { slugify } from '@/fields/slug'

const args = process.argv.slice(2)
const dryRun = args.includes('dry')
const file = args.find((arg) => arg !== 'dry')

const payload = await getPayload({ config })
const log = (message: string) => payload.logger.info(message)

if (!file || !fs.existsSync(file)) {
  payload.logger.error('Вкажіть файл: npm run import:products -- товари.csv')
  process.exit(1)
}

/**
 * Мінімальний розбір CSV: роздільник «;», лапки подвоюються всередині значення.
 * Свій, а не бібліотечний, бо формат ми ж і задаємо шаблоном.
 */
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          value += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        value += char
      }
      continue
    }

    if (char === '"') quoted = true
    else if (char === ';') {
      row.push(value)
      value = ''
    } else if (char === '\n') {
      row.push(value)
      rows.push(row)
      row = []
      value = ''
    } else if (char !== '\r') value += char
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value)
    rows.push(row)
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim().length > 0))
}

const split = (value: string): string[] =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

const number = (value: string): number | undefined => {
  const parsed = Number(value.replace(',', '.').replace(/[^\d.]/g, ''))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * Вільний слаг для категорії. «Набори» і «Набори для створення» дають однакове
 * `nabory`, а слаг унікальний — тому до другого дописуємо номер.
 */
const freeSlug = async (title: string): Promise<string> => {
  const base = slugify(title)
  for (let suffix = 1; suffix < 50; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`
    const taken = await payload.find({
      collection: 'categories',
      where: { slug: { equals: candidate } },
      limit: 1,
      overrideAccess: true,
    })
    if (taken.totalDocs === 0) return candidate
  }
  return `${base}-${Date.now()}`
}

/** Знаходить запис за назвою або створює новий — щоб імпорт не падав на дрібниці. */
const ensure = async (
  collection: 'colors' | 'sizes' | 'categories',
  title: string,
  extra: Record<string, unknown> = {},
): Promise<number> => {
  const found = await payload.find({
    collection,
    where: { title: { equals: title } },
    limit: 1,
    overrideAccess: true,
  })
  if (found.docs[0]) return found.docs[0].id

  if (dryRun) {
    log(`  + створився б запис у «${collection}»: ${title}`)
    return 0
  }

  const slug = collection === 'categories' ? { slug: await freeSlug(title) } : {}

  const created = await payload.create({
    collection,
    data: { title, ...slug, ...extra } as never,
    overrideAccess: true,
  })
  log(`  + новий запис у «${collection}»: ${title}`)
  return created.id
}

const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '')
const rows = parseCsv(raw)
const [header, ...body] = rows

const COLUMNS = [
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

const headerMatches = COLUMNS.every((name, index) => (header?.[index] ?? '').trim() === name)
if (!headerMatches) {
  payload.logger.error(
    `Перший рядок має збігатися з шаблоном. Очікується: ${COLUMNS.join(' ; ')}`,
  )
  process.exit(1)
}

log(`Файл: ${file}${dryRun ? ' (пробний запуск, нічого не записується)' : ''}`)
log(`Рядків до опрацювання: ${body.length}`)

let created = 0
let skipped = 0

for (const [index, cells] of body.entries()) {
  const [title, shortDescription, priceRaw, oldPriceRaw, categoryTitle, colorsRaw, sizesRaw, stockRaw, isKitRaw] =
    cells.map((cell) => cell.trim())

  const lineNumber = index + 2
  if (!title) continue

  // Рядок-підказка з шаблону: його не імпортуємо.
  if (title.startsWith('Заповнюйте з другого рядка')) continue

  const price = number(priceRaw ?? '')
  if (!price) {
    payload.logger.warn(`Рядок ${lineNumber}: «${title}» — не зрозуміла ціна «${priceRaw}», пропущено`)
    skipped += 1
    continue
  }

  const existing = await payload.find({
    collection: 'products',
    where: { title: { equals: title } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    log(`= «${title}» уже є, пропущено`)
    skipped += 1
    continue
  }

  const colorTitles = split(colorsRaw ?? '')
  const sizeTitles = split(sizesRaw ?? '')
  const stock = Number(stockRaw ?? '0') || 0

  const categoryId = categoryTitle ? await ensure('categories', categoryTitle) : undefined
  const colorIds: number[] = []
  for (const colorTitle of colorTitles) {
    // Колір вимагає код: ставимо нейтральний, власниця поправить в адмінці.
    colorIds.push(await ensure('colors', colorTitle, { hex: '#CFC6BC' }))
  }
  const sizeIds: number[] = []
  for (const sizeTitle of sizeTitles) sizeIds.push(await ensure('sizes', sizeTitle))

  // Варіації — усі комбінації колір × розмір. Якщо чогось із двох немає,
  // беремо той вимір, що заданий; якщо немає обох — товар без варіацій.
  const variants: { color?: number; size?: number; stock: number }[] = []
  if (colorIds.length && sizeIds.length) {
    for (const color of colorIds) for (const size of sizeIds) variants.push({ color, size, stock })
  } else if (colorIds.length) {
    for (const color of colorIds) variants.push({ color, stock })
  } else if (sizeIds.length) {
    for (const size of sizeIds) variants.push({ size, stock })
  }

  const data = {
    title,
    shortDescription: shortDescription || undefined,
    price,
    oldPrice: number(oldPriceRaw ?? ''),
    category: categoryId,
    isKit: /^(так|yes|1|true)$/i.test(isKitRaw ?? ''),
    status: 'draft',
    ...(variants.length > 0 ? { variants } : { stock }),
  }

  if (dryRun) {
    log(`+ «${title}» — ${variants.length || 'без'} варіацій, ціна ${price} ₴`)
    created += 1
    continue
  }

  await payload.create({ collection: 'products', data: data as never, overrideAccess: true })
  log(`+ «${title}» — ${variants.length || 'без'} варіацій, ціна ${price} ₴`)
  created += 1
}

log('')
log(`Створено: ${created} · пропущено: ${skipped}`)
log('Товари створені як чернетки: додайте фото в адмінці й перемкніть у «Опубліковано».')

process.exit(0)
