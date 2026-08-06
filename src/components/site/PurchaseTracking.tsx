'use client'

import { useEffect } from 'react'

import { track } from '@/components/site/Analytics'

const SENT_KEY = 'mk.purchase.sent'

export type PurchaseItem = {
  id: string
  title: string
  price: number
  quantity: number
}

/**
 * Подія покупки для Google Analytics. Meta цю ж покупку отримує ще й з сервера
 * (`src/lib/meta.ts`) — дублікат склеюється за номером замовлення.
 *
 * Нічого не малює: це лише виклик лічильників на сторінці «дякуємо».
 */
export const PurchaseTracking = ({
  orderNumber,
  total,
  items,
}: {
  orderNumber: string
  total: number
  items: PurchaseItem[]
}) => {
  useEffect(() => {
    // Сторінку «дякуємо» легко перезавантажити або відкрити з історії —
    // без цієї позначки та сама покупка порахувалась би кілька разів.
    if (window.sessionStorage.getItem(SENT_KEY) === orderNumber) return

    const send = () => {
      // Лічильники вантажаться після згоди на cookie й з відкладеним
      // пріоритетом, тому на момент показу сторінки їх може ще не бути.
      if (!window.gtag && !window.fbq) return false

      window.sessionStorage.setItem(SENT_KEY, orderNumber)
      track(
        'purchase',
        {
          transaction_id: orderNumber,
          currency: 'UAH',
          value: total,
          items: items.map((item) => ({
            item_id: item.id,
            item_name: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
        },
        orderNumber,
      )
      return true
    }

    if (send()) return

    // Чекаємо появи лічильників, але не вічно: якщо згоди на cookie не дали,
    // їх не буде взагалі.
    let left = 20
    const timer = setInterval(() => {
      if (send() || --left <= 0) clearInterval(timer)
    }, 500)

    return () => clearInterval(timer)
  }, [orderNumber, total, items])

  return null
}
