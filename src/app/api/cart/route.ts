import config from '@payload-config'
import crypto from 'crypto'
import { cookies, headers as nextHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload, type Payload } from 'payload'

import { imageUrl } from '@/lib/media'

const COOKIE = 'mk_cart'
const YEAR = 60 * 60 * 24 * 365

type Line = { kind: 'product' | 'course'; itemId: string; variantId?: string; quantity: number }

const key = (line: Line) => `${line.kind}:${line.itemId}:${line.variantId ?? 'base'}`

/**
 * Злиття, а не заміна: людина набрала щось на телефоні, зайшла з компʼютера —
 * жодна зі сторін не має зникнути. Для однакових позицій беремо більшу
 * кількість: це майже завжди свідоміший вибір, ніж старіша.
 */
const merge = (a: Line[], b: Line[]): Line[] => {
  const result = new Map<string, Line>()
  for (const line of [...a, ...b]) {
    const existing = result.get(key(line))
    result.set(
      key(line),
      existing ? { ...existing, quantity: Math.max(existing.quantity, line.quantity) } : line,
    )
  }
  return [...result.values()]
}

/**
 * Назви, ціни й залишки віддає сервер, а не памʼять браузера: інакше кошик,
 * пролежавши тиждень, показував би стару ціну або зниклий товар.
 */
const hydrate = async (payload: Payload, lines: Line[]) => {
  const items = []

  for (const line of lines) {
    if (line.kind === 'course') {
      const course = await payload
        .findByID({ collection: 'courses', id: line.itemId, depth: 1 })
        .catch(() => null)
      if (!course || course.status !== 'published') continue

      const direction = typeof course.direction === 'object' ? course.direction?.slug : null
      items.push({
        key: `course:${course.id}`,
        kind: 'course' as const,
        id: String(course.id),
        title: course.title,
        price: course.price,
        quantity: 1,
        image: imageUrl(course.cover, 'thumbnail') ?? undefined,
        href: direction ? `/courses/${direction}/${course.slug}` : '/courses',
      })
      continue
    }

    const product = await payload
      .findByID({ collection: 'products', id: line.itemId, depth: 2 })
      .catch(() => null)
    if (!product || product.status !== 'published') continue

    const variant = line.variantId ? product.variants?.find((v) => v.id === line.variantId) : undefined
    if (product.variants?.length && !variant) continue

    const stock = variant ? (variant.stock ?? 0) : (product.stock ?? 0)
    if (stock <= 0) continue

    const color = variant && typeof variant.color === 'object' ? variant.color : null
    const size = variant && typeof variant.size === 'object' ? variant.size : null
    const images = Array.isArray(product.images) ? product.images : []

    items.push({
      key: `product:${product.id}:${variant?.id ?? 'base'}`,
      kind: 'product' as const,
      id: String(product.id),
      variantId: variant?.id ?? undefined,
      title: product.title,
      variantLabel: [color?.title, size?.title].filter(Boolean).join(' · ') || undefined,
      color: color?.title ?? undefined,
      size: size?.title ?? undefined,
      price: variant?.price ?? product.price,
      quantity: Math.min(line.quantity, stock),
      image: imageUrl(variant?.image ?? images[0], 'thumbnail') ?? undefined,
      href: `/shop/${product.slug}`,
      maxQuantity: stock,
    })
  }

  return items
}

const resolveCart = async (payload: Payload, token: string, customerId?: string | number) => {
  // Обліковий запис має пріоритет: він переживає зміну браузера.
  if (customerId) {
    const byCustomer = await payload.find({
      collection: 'carts',
      where: { customer: { equals: customerId } },
      limit: 1,
      overrideAccess: true,
    })
    if (byCustomer.docs[0]) return byCustomer.docs[0]
  }

  const byToken = await payload.find({
    collection: 'carts',
    where: { token: { equals: token } },
    limit: 1,
    overrideAccess: true,
  })
  return byToken.docs[0] ?? null
}

const context = async () => {
  const payload = await getPayload({ config })
  const store = await cookies()
  const token = store.get(COOKIE)?.value ?? crypto.randomBytes(24).toString('hex')
  const { user } = await payload.auth({ headers: await nextHeaders() })
  return { payload, token, customerId: user?.collection === 'customers' ? user.id : undefined }
}

const withCookie = (body: unknown, token: string) => {
  const response = NextResponse.json(body)
  response.cookies.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: YEAR })
  return response
}

/**
 * «Може сподобатись» у шухляді кошика (макет 123:2734): найдешевший
 * опублікований товар у наявності, якого ще немає в кошику. Дешевий — бо це
 * додача до вже набраного, а не друга покупка.
 */
/*
  Блок «Може сподобатись» у кошику (123:2734).

  Спершу — те, що клієнтка сама відмітила галочкою «Пропонувати в кошику».
  Це головне: раніше сюди просто потрапляв найдешевший товар у магазині,
  без жодного звʼязку з тим, що людина купує, і вплинути на це було ніяк.

  Якщо не відмічено нічого — лишається стара поведінка, найдешевший із
  наявних. Порожнім блок не лишаємо: у макеті він є, і дірка на його місці
  виглядала б як поломка.
*/
const suggest = async (payload: Payload, items: { id: string }[]) => {
  const chosen = new Set(items.map((item) => item.id))

  const pick = async (suggested: boolean) => {
    const found = await payload.find({
      collection: 'products',
      where: {
        status: { equals: 'published' },
        ...(suggested ? { suggestInCart: { equals: true } } : {}),
      },
      sort: 'price',
      limit: chosen.size + 1,
      depth: 2,
    })
    return found.docs.find((doc) => !chosen.has(String(doc.id))) ?? null
  }

  const product = (await pick(true)) ?? (await pick(false))
  if (!product) return null

  const images = Array.isArray(product.images) ? product.images : []

  return {
    kind: 'product' as const,
    id: String(product.id),
    title: product.title,
    price: product.price,
    image: imageUrl(images[0], 'thumbnail') ?? undefined,
    href: `/shop/${product.slug}`,
  }
}

/*
  Запасний кошик для перевірки parity — той самий підхід, що й
  PARITY_DEMO_ACCOUNT у `src/lib/account.ts`: перевірка ходить на сторінку
  звичайним браузером, без cookie й без набраного кошика, і бачила б порожню
  шухляду замість кадру «Кошик» 121:2951.

  Вмикати треба явно (`PARITY_DEMO_CART=braslet-polyn,kolie-biser npm run dev`),
  у продакшен-збірці не працює. Слаги — товарів і курсів, через кому.
*/
const parityDemoLines = async (payload: Payload): Promise<Line[]> => {
  const raw = process.env.PARITY_DEMO_CART
  if (!raw || process.env.NODE_ENV === 'production') return []

  const slugs = raw
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean)

  const lines: Line[] = []

  for (const slug of slugs) {
    for (const kind of ['product', 'course'] as const) {
      const found = await payload.find({
        collection: kind === 'product' ? 'products' : 'courses',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 1,
      })

      const doc = found.docs[0]
      if (!doc) continue

      // Товар із варіаціями без variantId не пройшов би hydrate.
      const variantId =
        kind === 'product' && 'variants' in doc ? doc.variants?.[0]?.id ?? undefined : undefined

      lines.push({ kind, itemId: String(doc.id), variantId: variantId ?? undefined, quantity: 1 })
      break
    }
  }

  return lines
}

export const GET = async () => {
  const { payload, token, customerId } = await context()
  const cart = await resolveCart(payload, token, customerId)

  const stored = (cart?.items as Line[] | undefined) ?? []
  const lines = stored.length > 0 ? stored : await parityDemoLines(payload)

  const items = await hydrate(payload, lines)
  const suggestion = await suggest(payload, items)

  // Прапорець для перевірки parity: вона знімає кадр одразу після завантаження
  // і не вміє клікати, тож шухляда має бути вже відкритою.
  const parityDemo = stored.length === 0 && lines.length > 0

  return withCookie({ items, suggestion, parityDemo }, cart?.token ?? token)
}

export const PUT = async (request: Request) => {
  const { payload, token, customerId } = await context()
  const body = (await request.json()) as { items?: Line[]; email?: string }

  const incoming = (Array.isArray(body.items) ? body.items : [])
    .filter((line) => line && (line.kind === 'product' || line.kind === 'course') && line.itemId)
    .map((line) => ({
      kind: line.kind,
      itemId: String(line.itemId),
      variantId: line.variantId ? String(line.variantId) : undefined,
      quantity: Math.max(1, Math.min(Number(line.quantity) || 1, 99)),
    }))
    .slice(0, 60)

  const existing = await resolveCart(payload, token, customerId)

  // Зливаємо лише коли до облікового запису приїхав кошик з іншого пристрою.
  // Далі джерело правди — браузер, інакше прибрану позицію не вдалося б видалити.
  const shouldMerge = Boolean(existing && customerId && existing.token !== token)
  const items = shouldMerge ? merge((existing?.items as Line[]) ?? [], incoming) : incoming

  const data = {
    token: existing?.token ?? token,
    customer: customerId ?? (typeof existing?.customer === 'object' ? existing?.customer?.id : existing?.customer) ?? undefined,
    email: body.email ?? existing?.email ?? undefined,
    items,
  }

  const cart = existing
    ? await payload.update({ collection: 'carts', id: existing.id, data, overrideAccess: true })
    : await payload.create({ collection: 'carts', data, overrideAccess: true })

  return withCookie({ items: await hydrate(payload, items) }, cart.token)
}
