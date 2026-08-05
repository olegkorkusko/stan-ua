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

export const GET = async () => {
  const { payload, token, customerId } = await context()
  const cart = await resolveCart(payload, token, customerId)
  const items = await hydrate(payload, (cart?.items as Line[] | undefined) ?? [])
  return withCookie({ items }, cart?.token ?? token)
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
