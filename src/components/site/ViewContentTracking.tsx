'use client'

import { useEffect } from 'react'

import { track } from '@/components/site/Analytics'

/**
 * Перегляд товару для лічильників.
 *
 * Без цієї події Meta не знає, хто що дивився, і найдешевша аудиторія —
 * «дивився товар, але не купив» — просто недоступна. У кабінеті це видно
 * одразу: 10 230 додавань у кошик проти 612 переглядів, тобто воронка
 * перевернута з ніг на голову.
 *
 * Нічого не малює: це лише виклик лічильників на сторінці товару.
 */
export const ViewContentTracking = ({
  id,
  title,
  price,
  category,
}: {
  id: string
  title: string
  price: number
  category?: string
}) => {
  useEffect(() => {
    // Лічильники вмикаються після згоди на cookie й з відкладеним
    // пріоритетом, тому на момент показу сторінки їх може ще не бути.
    const send = () => {
      if (!window.gtag && !window.fbq) return false
      track('view_item', {
        currency: 'UAH',
        value: price,
        // Meta читає саме content_ids і content_type; items — для Google.
        content_ids: [id],
        content_type: 'product',
        content_name: title,
        ...(category ? { content_category: category } : {}),
        items: [{ item_id: id, item_name: title, price, quantity: 1 }],
      })
      return true
    }

    if (send()) return

    // Чекаємо появи лічильників, але не вічно: без згоди їх не буде взагалі.
    let left = 20
    const timer = setInterval(() => {
      if (send() || --left <= 0) clearInterval(timer)
    }, 500)

    return () => clearInterval(timer)
  }, [id, title, price, category])

  return null
}
