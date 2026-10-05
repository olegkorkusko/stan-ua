'use client'

import { usePathname } from 'next/navigation'

import { LocaleLink as Link, useLocale } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'
import { useCart } from '@/providers/CartProvider'

/*
  Підтвердження, що товар поклали в кошик.

  Поки шухляда відкривалась сама, підтвердження було не потрібне — його роль
  грала сама панель. Коли її прибрали (вона перекривала каталог), не лишилось
  нічого: людина тисне «Купити», і зовні не змінюється нічого, крім цифри в
  кутку. Клієнтка на це й поскаржилась — «треба здогадатись, що йти в кошик».

  Тому смужка внизу: що саме додали, і дві дороги далі. Зникає сама за 5 секунд
  і нічого не перекриває — у цьому вся різниця з шухлядою.

  role="status" + aria-live="polite" — щоб екранний диктор прочитав появу, але
  не перебивав людину на півслові.
*/
export const CartNotice = () => {
  const { notice, dismissNotice, open } = useCart()
  const pathname = usePathname()
  const t = dictionary(useLocale()).cart

  /*
    На оформленні смужка зайва: людина вже там, куди вона веде. Найпомітніше
    це на курсі — кнопка «Купити» сама везе на оформлення, і смужка приїздила
    слідом, пропонуючи піти туди, де вже стоїш.

    Перевірка тут, а не відмовою від сповіщення в CourseBuy: у кошик кладуть
    не лише звідти — ще й із «Може сподобатись» у самій шухляді.
  */
  if (!notice || pathname.includes('/checkout')) return null

  return (
    <div
      role="status"
      aria-live="polite"
      /*
        Над шухлядою кошика стояти не може — вона теж фіксована. z-40 проти
        z-50 у шухляди: якщо людина встигла відкрити кошик, смужка ховається
        під ним, а не навпаки.
      */
      className="show-fast fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md flex-col gap-3 border border-ink bg-paper p-4 shadow-lg md:inset-x-auto md:right-6 md:bottom-6"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="title-sm">{t.added}</p>
          <p className="mt-1 truncate text-[13px] text-muted">{notice}</p>
        </div>
        <button
          type="button"
          onClick={dismissNotice}
          aria-label={t.addedClose}
          className="-m-2 shrink-0 p-2 text-muted transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className="w-3.5">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            dismissNotice()
            open()
          }}
          className="btn btn-outline flex-1"
        >
          {t.addedView}
        </button>
        <Link href="/checkout" onClick={dismissNotice} className="btn btn-primary flex-1">
          {t.addedCheckout}
        </Link>
      </div>
    </div>
  )
}
