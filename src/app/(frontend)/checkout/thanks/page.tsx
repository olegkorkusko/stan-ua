import type { Metadata } from 'next'
import Link from 'next/link'

import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Дякуємо',
  robots: { index: false },
}

type SearchParams = Promise<{ order?: string; pending?: string }>

const ThanksPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { order: orderNumber, pending } = await searchParams

  const payload = await payloadClient()
  const found = orderNumber
    ? await payload.find({
        collection: 'orders',
        where: { orderNumber: { equals: orderNumber } },
        limit: 1,
        overrideAccess: true,
        depth: 0,
      })
    : { docs: [] }

  const order = found.docs[0]
  const paid = order?.paymentStatus === 'paid' || order?.paymentStatus === 'partial'
  const hasCourse = order?.items?.some((item) => item.kind === 'course')

  return (
    <div className="shell flex min-h-[70svh] flex-col items-center justify-center py-24 text-center">
      <p className="label">{orderNumber ?? 'Замовлення'}</p>

      <h1 className="mt-4 max-w-2xl text-[clamp(1.75rem,4vw,3rem)]">
        {paid ? 'Дякуємо! Замовлення оплачено' : 'Замовлення прийнято'}
      </h1>

      <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-muted">
        {pending
          ? 'Ми зв’яжемось із вами найближчим часом і надішлемо реквізити для оплати.'
          : paid
            ? hasCourse
              ? 'Доступ до курсу вже надіслано на вашу пошту. Якщо листа немає — перевірте «Спам».'
              : 'Ми пакуємо замовлення й надішлемо ТТН, щойно передамо його перевізнику.'
            : 'Щойно банк підтвердить оплату, ми надішлемо лист. Зазвичай це займає до хвилини.'}
      </p>

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
