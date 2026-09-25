import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

type Body = { email?: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Посилання для входу — з прямою відповіддю, чи є така пошта.
 *
 * Штатний `/api/customers/forgot-password` мовчить завжди: і коли лист пішов,
 * і коли адреси в базі немає. Людина бачила «якщо ця пошта в нас є, посилання
 * вже летить» і чекала листа, якого ніхто не надсилав. Здогадатися, що річ в
 * адресі, неможливо — з того боку екрана видно те саме, що й при успіху.
 *
 * Приховувати тут уже нічого: реєстрація на сусідній вкладці й так відповідає
 * «ця пошта вже зареєстрована», тож перевірити адресу можна було й до цього.
 */
export const POST = async (request: Request) => {
  const payload = await getPayload({ config })
  const body = (await request.json()) as Body
  const email = body.email?.trim().toLowerCase() ?? ''

  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: 'Перевірте адресу пошти' }, { status: 400 })
  }

  const existing = await payload.find({
    collection: 'customers',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.totalDocs === 0) return NextResponse.json({ known: false })

  await payload.forgotPassword({ collection: 'customers', data: { email } })

  return NextResponse.json({ known: true })
}
