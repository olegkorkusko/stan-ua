'use client'

import Image from 'next/image'
import { useEffect } from 'react'

import { LocaleLink as Link, useLocale } from '@/components/site/LocaleLink'
import { formatPrice } from '@/lib/format'
import { FREE_DELIVERY_FROM } from '@/lib/delivery'
import { dictionary } from '@/lib/i18n'
import { useScrollLock } from '@/lib/useScrollLock'
import { useCart, type CartItem } from '@/providers/CartProvider'

/*
  Шухляда кошика — макет «Кошик» 121:2951 (десктоп) і «Кошик — моб» 315:7174.

  Геометрія: 900 біля правого краю поверх затемнення #0D0D0A 50%, усередині дві
  колонки — «Позиції» 540 і «Підсумок» 360 (60/40). На мобільному ті самі дві
  частини стають одна під одною на всю ширину.

  Вкладка «Обране» в макеті намальована лише написом — власного кадру в неї
  немає, тому вона веде на наявний екран збережених, а не перемикає вміст.
*/

/*
  Вузли Figma на позицію кошика: у макеті намальовано три картки.

  `text` — колонка з назвою й ціною, яку дизайнер завів лише в першій картці
  («Frame 1» 414:7151), коли переносив кількість у правий стовпчик. У другій і
  третій картках такої обгортки ще немає, тож там вузла не існує.
*/
const ITEM_NODES: readonly Record<string, string | undefined>[] = [
  {
    card: '122:2728',
    photo: '122:2729',
    body: '122:2730',
    text: '414:7151',
    title: '122:2731',
    price: '122:2732',
    variant: '122:2733',
    stock: '122:2734',
    actions: '122:2735',
    quantity: '122:2736',
    less: '122:2737',
    value: '122:2738',
    more: '122:2739',
    remove: '122:2740',
  },
  {
    card: '122:2741',
    photo: '122:2742',
    body: '122:2743',
    title: '122:2744',
    price: '122:2745',
    variant: '122:2746',
    stock: '122:2747',
    actions: '122:2748',
    quantity: '122:2749',
    less: '122:2750',
    value: '122:2751',
    more: '122:2752',
    remove: '122:2753',
  },
  {
    card: '122:2754',
    photo: '122:2755',
    body: '122:2756',
    title: '122:2757',
    price: '122:2758',
    variant: '122:2759',
    stock: '122:2760',
    actions: '122:2761',
    quantity: '122:2762',
    less: '122:2763',
    value: '122:2764',
    more: '122:2765',
    remove: '122:2766',
  },
]

const muted = 'text-[13px]/[19.5px] text-muted'

export const CartDrawer = () => {
  const { items, suggestion, total, isOpen, close, remove, setQuantity, add } = useCart()
  const t = dictionary(useLocale()).cart

  useScrollLock(isOpen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const left = Math.max(0, FREE_DELIVERY_FROM - total)
  const progress = Math.min(1, FREE_DELIVERY_FROM > 0 ? total / FREE_DELIVERY_FROM : 1)

  /*
    Підпис позиції: у курсу — як приходить доступ, у товару — колір і розмір
    із підписами («Колір: Полин · Розмір S», 122:2733). Поки сервер не
    відповів, у щойно доданої позиції окремих полів ще немає — тоді показуємо
    короткий `variantLabel`, а не порожнечу.
  */
  const variantOf = (item: CartItem) => {
    if (item.kind === 'course') return t.telegramForever
    if (!item.color && !item.size) return item.variantLabel

    return [
      item.color && `${t.colorLabel}: ${item.color}`,
      item.size && `${t.sizeLabel} ${item.size}`,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  return (
    /*
      `inert` — те саме, що й у SideDrawer: без нього aria-hidden лишає
      всередині закритого кошика фокусовані кнопки, і це порушення
      aria-hidden-focus.
    */
    <div
      className={`fixed inset-0 z-70 overflow-y-auto md:overflow-hidden ${
        isOpen ? '' : 'pointer-events-none'
      }`}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={t.close}
        onClick={close}
        className={`absolute inset-0 bg-[#0D0D0A]/50 transition-opacity duration-400 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        data-figma-node="121:2951"
        data-figma-state={isOpen ? 'cart-open' : undefined}
        aria-label={t.title}
        className={`absolute right-0 top-0 flex min-h-full w-full flex-col bg-paper transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] md:inset-y-0 md:min-h-0 md:w-[min(900px,96vw)] md:flex-row md:overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div
          data-figma-node="122:2719"
          className="flex flex-col gap-6.5 px-4 py-8 md:w-3/5 md:overflow-y-auto md:p-8"
        >
          {/*
            Рядка «КОШИК / ЗБЕРЕЖЕНІ» тут немає свідомо: у «Шухляді кошика»
            (121:2951) його вже немає й у макеті — фрейм «Позиції» (122:2719)
            починається одразу зі смуги безкоштовної доставки. Код тягнув його
            зі старої версії дизайну, вузлів 122:2720–2722 у файлі не лишилось.

            Назву шухляди тримає aria-label на <aside>, тож для читача екрана
            нічого не загубилось.
          */}
          <div data-figma-node="122:2723" className="flex flex-col gap-2.5">
            <p data-figma-node="122:2724" className="text-[13px]/[19.5px] text-ink">
              {left > 0
                ? t.freeDeliveryLeft.replace('{sum}', formatPrice(left))
                : t.freeDeliveryReached}
            </p>
            <div data-figma-node="122:2725" className="h-0.75 w-full bg-flax">
              <div
                data-figma-node="122:2726"
                className="h-full bg-ink"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-start gap-4 py-8">
              <p className="text-sm text-muted">{t.empty}</p>
              <Link href="/courses" className="btn btn-outline" onClick={close}>
                {t.chooseCourse}
              </Link>
            </div>
          ) : (
            <ul data-figma-node="122:2727" className="flex flex-col">
              {items.map((item, index) => {
                const node = ITEM_NODES[index]
                const atLimit = item.quantity >= (item.maxQuantity ?? Infinity)

                return (
                  <li
                    key={item.key}
                    data-figma-node={node?.card}
                    className="flex flex-col gap-4 border-t border-hairline py-5.5 md:flex-row md:gap-4.5"
                  >
                    <Link
                      href={item.href}
                      onClick={close}
                      className="relative h-26 w-full shrink-0 md:w-26"
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          data-figma-node={node?.photo}
                          fill
                          sizes="(min-width: 768px) 104px, 100vw"
                          className="object-cover"
                        />
                      ) : (
                        <span className="weave block h-full w-full" />
                      )}
                    </Link>

                    <div
                      data-figma-node={node?.body}
                      className="flex min-w-0 flex-1 flex-col gap-1.75 md:flex-row md:items-center md:justify-between"
                    >
                      <div data-figma-node={node?.text} className="flex flex-col gap-1.75">
                        <Link
                          href={item.href}
                          onClick={close}
                          data-figma-node={node?.title}
                          className="text-[15px]/[24px] text-ink"
                        >
                          {item.title}
                        </Link>
                        <span
                          data-figma-node={node?.price}
                          className="font-display text-[13px]/[16.9px] text-ink"
                        >
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        {variantOf(item) && (
                          <span data-figma-node={node?.variant} className={muted}>
                            {variantOf(item)}
                          </span>
                        )}
                        <span data-figma-node={node?.stock} className={muted}>
                          {item.kind === 'course' ? t.instantAccess : t.inStock}
                        </span>
                      </div>

                      <div
                        data-figma-node={node?.actions}
                        className="flex items-center gap-4 pt-1 md:flex-col md:justify-between md:gap-4 md:self-stretch"
                      >
                        <div
                          data-figma-node={node?.quantity}
                          className="flex h-8 items-center gap-3.5 border border-hairline px-3 py-1.5"
                        >
                          <button
                            type="button"
                            onClick={() => setQuantity(item.key, item.quantity - 1)}
                            aria-label={t.less}
                            data-figma-node={node?.less}
                            className="text-[15px]/[24px] text-ink transition-opacity hover:opacity-60"
                          >
                            –
                          </button>
                          <span
                            data-figma-node={node?.value}
                            className="text-[13px]/[19.5px] text-ink"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.key, item.quantity + 1)}
                            disabled={item.kind === 'course' || atLimit}
                            aria-label={t.more}
                            data-figma-node={node?.more}
                            className="text-[15px]/[24px] text-ink transition-opacity hover:opacity-60 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.key)}
                          data-figma-node={node?.remove}
                          className={`${muted} underline underline-offset-2 transition-opacity hover:opacity-60`}
                        >
                          {t.remove}
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div
          data-figma-node="123:2719"
          className="flex flex-col justify-between gap-6 bg-paper-deep px-4 py-7 md:w-2/5 md:overflow-y-auto md:p-7"
        >
          <div data-figma-node="123:2720" className="flex flex-col gap-5.5">
            <div data-figma-node="123:2721" className="flex justify-end">
              <button
                type="button"
                onClick={close}
                aria-label={t.close}
                data-figma-node="123:2722"
                className="text-ink transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <svg
                  viewBox="0 0 12 12"
                  className="size-3"
                  fill="none"
                  aria-hidden="true"
                  data-figma-node="123:2723"
                >
                  <path
                    d="M1 1L11 11M11 1L1 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <p data-figma-node="123:2724" className="title-sm">
              {t.summary}
            </p>

            <div data-figma-node="123:2725" className="flex items-center justify-between gap-3">
              <span data-figma-node="123:2726" className={muted}>
                {t.items}
              </span>
              <span data-figma-node="123:2727" className="text-[13px]/[19.5px] text-ink">
                {formatPrice(total)}
              </span>
            </div>

            <div data-figma-node="123:2728" className="flex items-center justify-between gap-3">
              <span data-figma-node="123:2729" className={muted}>
                {t.delivery}
              </span>
              <span data-figma-node="123:2730" className="text-[13px]/[19.5px] text-ink">
                {t.deliveryAtCheckout}
              </span>
            </div>

            <div
              data-figma-node="123:2731"
              className="flex items-center justify-between gap-3 border-t border-hairline-strong pt-4.5"
            >
              <span data-figma-node="123:2732" className={muted}>
                {t.toPay}
              </span>
              <span data-figma-node="123:2733" className="title-sm">
                {formatPrice(total)}
              </span>
            </div>

            {suggestion && (
              <div
                data-figma-node="123:2734"
                className="flex flex-col gap-4 border-t border-hairline-strong pt-5"
              >
                <span data-figma-node="123:2735" className="label">
                  {t.mayLike.toUpperCase()}
                </span>
                <div
                  data-figma-node="123:2736"
                  className="flex flex-col gap-4 md:flex-row md:items-center md:gap-3.5"
                >
                  <Link
                    href={suggestion.href}
                    onClick={close}
                    className="relative size-18 shrink-0"
                  >
                    {suggestion.image ? (
                      <Image
                        src={suggestion.image}
                        alt={suggestion.title}
                        data-figma-node="123:2737"
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="weave block h-full w-full" />
                    )}
                  </Link>
                  <div data-figma-node="123:2738" className="flex min-w-0 flex-1 flex-col gap-1.25">
                    <Link
                      href={suggestion.href}
                      onClick={close}
                      data-figma-node="123:2739"
                      className="text-[13px]/[19.5px] text-ink"
                    >
                      {suggestion.title}
                    </Link>
                    <span
                      data-figma-node="123:2740"
                      className="font-display text-[13px]/[16.9px] text-ink"
                    >
                      {formatPrice(suggestion.price)}
                    </span>
                    <button
                      type="button"
                      data-figma-node="123:2741"
                      onClick={() =>
                        add({
                          ...suggestion,
                          key: `product:${suggestion.id}:base`,
                        })
                      }
                      className="label self-start text-ink underline underline-offset-2 transition-opacity hover:opacity-60"
                    >
                      {t.add.toUpperCase()}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/checkout"
            onClick={close}
            data-figma-node="123:2742"
            className="btn btn-primary w-full"
          >
            {t.placeOrder}
          </Link>
        </div>
      </aside>
    </div>
  )
}
