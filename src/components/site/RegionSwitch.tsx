'use client'

import { dictionary } from '@/lib/i18n'
import { REGION_COOKIE, type Region } from '@/lib/region'
import { useLocale } from '@/components/site/LocaleLink'
import { useMoney } from '@/providers/MoneyProvider'

/*
  Перемикач «куди доставляти» — від нього залежить ціна.

  Чому він узагалі видимий, а не вгадується за IP. Країну з IP визначають із
  помилками: VPN, мобільні оператори, і найчастіший випадок — українці за
  кордоном, які замовляють рідним в Україну. Якби ціна мовчки залежала від
  IP, така людина побачила б дорожчий товар і не зрозуміла чому. Тут вона
  бачить причину й може її виправити.

  Перезавантаження сторінки повне, як і в перемикача мов: ціни рендеряться на
  сервері з cookie, і клієнтський роутер сам їх не оновить.
*/
/*
  Запис cookie й перезавантаження — поза компонентом.

  Правило react-hooks не дозволяє міняти зовнішнє значення під час рендеру чи
  в обробнику всередині компонента: компілятор React має право вважати рендер
  чистим. `document.cookie` для нього — саме таке зовнішнє значення. Те саме
  вже ловилось на Date.now() у сторінці статистики.

  Рік життя — щоб вибір не злітав між візитами. SameSite=Lax: cookie потрібна
  і при переходах із реклами, і в запитах до /api з того ж сайту, бо ціну для
  кошика й оплати сервер бере саме з неї.
*/
const remember = (value: Region) => {
  document.cookie = `${REGION_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`
  window.location.reload()
}

export const RegionSwitch = () => {
  const locale = useLocale()
  const { region } = useMoney()
  const t = dictionary(locale).header

  const choose = (value: Region) => {
    if (value === region) return
    remember(value)
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted" aria-label={t.shipTo}>
      {(['ua', 'intl'] as const).map((option, index) => (
        <span key={option} className="inline-flex items-center gap-1.5">
          {index > 0 && <span aria-hidden="true">/</span>}
          {option === region ? (
            <span className="text-ink" aria-current="true">
              {t.region[option]}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => choose(option)}
              className="transition-colors hover:text-ink active:text-ink/70"
            >
              {t.region[option]}
            </button>
          )}
        </span>
      ))}
    </span>
  )
}
