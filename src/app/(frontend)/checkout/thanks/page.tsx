import type { Metadata } from 'next'

import { dictionary, type Locale } from '@/lib/i18n'
import { LocaleLink as Link } from '@/components/site/LocaleLink'

import { ClearCartOnPaid } from '@/components/site/ClearCartOnPaid'
import { PurchaseTracking } from '@/components/site/PurchaseTracking'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'
import type { Order } from '@/payload-types'

export const dynamic = 'force-dynamic'

/*
  Заголовок вкладки й опис для пошуку залежать від мови, тому це функція,
  а не сталий обʼєкт: мова приходить із заголовка запиту.
*/
export const generateMetadata = async (): Promise<Metadata> => {
  // Службові сторінки в пошуку не потрібні — заборона індексації тут же.
  return { robots: { index: false }, title: dictionary(await getLocale()).meta.thanks }
}

type SearchParams = Promise<{ order?: string; pending?: string }>

/*
  Запрошення в Telegram просто на сторінці подяки, а не «перевірте пошту».

  Посилання лежать у покупця: fulfillOrder кладе їх у «Куплені доступи» разом
  із номером замовлення, за яким вони видані. Беремо саме ті, що з цього.

  Чому це не діра, хоч сторінка відкривається за самим лише номером
  замовлення: запрошення одноразове (member_limit 1) і живе добу. Та й
  свіжість перевіряємо — показуємо лише дві години після оплати. Хто вгадає
  номер пізніше, побачить ту саму сторінку без посилань.
*/
const FRESH_MS = 2 * 60 * 60 * 1000

const courseInvites = async (
  payload: Awaited<ReturnType<typeof payloadClient>>,
  order: Order,
  locale: Locale,
) => {
  if (Date.now() - new Date(order.updatedAt).getTime() > FRESH_MS) return []
  const customerId = typeof order.customer === 'object' ? order.customer?.id : order.customer
  if (!customerId) return []

  const customer = await payload
    .findByID({ collection: 'customers', id: customerId, depth: 1, overrideAccess: true, locale })
    .catch(() => null)

  // depth: 1 розгортає й course, й relatedOrder — звідси обидві форми.
  const orderIdOf = (value: unknown) =>
    typeof value === 'object' && value !== null ? (value as { id?: number }).id : value

  return (customer?.access ?? [])
    .filter((item) => orderIdOf(item.relatedOrder) === order.id && item.telegramInviteLink)
    .map((item) => ({
      href: item.telegramInviteLink as string,
      title: typeof item.course === 'object' ? (item.course?.title ?? '') : '',
    }))
}

const ThanksPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { order: orderNumber, pending } = await searchParams

  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)
  const found = orderNumber
    ? await payload.find({ locale,
        collection: 'orders',
        where: { orderNumber: { equals: orderNumber } },
        limit: 1,
        overrideAccess: true,
        depth: 0,
      })
    : { docs: [] }

  const order = found.docs[0]
  const paid = order?.paymentStatus === 'paid'
  const hasCourse = order?.items?.some((item) => item.kind === 'course')

  const invites = paid && hasCourse ? await courseInvites(payload, order!, locale) : []

  return (
    <div className="shell flex min-h-[70svh] flex-col items-center justify-center py-24 text-center">
      {paid && <ClearCartOnPaid />}

      {paid && order && (
        <PurchaseTracking
          orderNumber={order.orderNumber}
          total={order.total}
          items={(order.items ?? []).map((item) => ({
            id: String(item.kind === 'course' ? item.course : item.product),
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          }))}
        />
      )}

      <p className="label">{orderNumber ?? 'Замовлення'}</p>

      <h1 className="mt-4 max-w-2xl text-page">
        {paid ? 'Дякуємо! Замовлення оплачено' : 'Замовлення прийнято'}
      </h1>

      <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-muted">
        {pending
          ? 'Ми зв’яжемось із вами найближчим часом і надішлемо реквізити для оплати.'
          : paid
            ? hasCourse
              ? invites.length > 0
                ? t.common.accessReady
                : t.common.accessWait
              : 'Ми пакуємо замовлення й надішлемо ТТН, щойно передамо його перевізнику.'
            : 'Щойно банк підтвердить оплату, ми надішлемо лист. Зазвичай це займає до хвилини.'}
      </p>

      {invites.length > 0 && (
        <div className="mt-7 flex w-full max-w-md flex-col gap-2">
          {invites.map((invite) => (
            <a
              key={invite.href}
              href={invite.href}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              {invite.title ? `${t.account.openTelegram} · ${invite.title}` : t.account.openTelegram}
            </a>
          ))}
        </div>
      )}

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-outline">
          Далі до магазину
        </Link>
        {hasCourse && (
          <Link href="/account" className="btn btn-primary">
            Мої доступи
          </Link>
        )}
      </div>
    </div>
  )
}

export default ThanksPage
