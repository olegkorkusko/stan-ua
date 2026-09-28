import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

// 404 для публічної частини. Портал-splash у дизайні не має chrome, тож із
// ненайденої сторінки ведемо двома гілками — так само, як із головної.
const NotFound = async () => {
  const t = dictionary(await getLocale()).common

  return (
  <div className="shell py-32 text-center">
    <p className="label">{t.notFoundLabel}</p>
    <h1 className="mt-3 text-page">{t.notFoundTitle}</h1>
    <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted">
      Можливо, адреса змінилася або сторінку прибрали.
    </p>

    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
      <Link href="/shop" className="btn">
        Готові вироби
      </Link>
      <Link href="/courses" className="btn btn-outline">
        Навчання
      </Link>
    </div>
  </div>
  )
}

export default NotFound
