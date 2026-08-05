import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

/** Підписка на розсилку. Повторна підписка тією ж поштою не помилка. */
export const POST = async (request: Request) => {
  const payload = await getPayload({ config })
  const { email, source } = (await request.json()) as { email?: string; source?: string }

  const address = (email ?? '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
    return NextResponse.json({ error: 'Перевірте адресу пошти' }, { status: 400 })
  }

  const existing = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: address } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'subscribers',
      overrideAccess: true,
      data: {
        email: address,
        source: source === 'checkout' ? 'checkout' : 'footer',
        active: true,
      },
    })
  }

  return NextResponse.json({ ok: true })
}
