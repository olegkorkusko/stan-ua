'use client'

import { Link, useConfig } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'

/*
  Пункт «Звідки замовлення» в бічному меню адмінки.

  Payload до власної сторінки (admin.components.views) посилання НЕ додає — він
  реєструє лише адресу, і зайти можна тільки набравши її руками. Пункт меню
  кладеться окремо, через admin.components.afterNavLinks.

  Класи й розмітка — ті самі, що в рідних пунктів Payload: nav__link, смужка
  nav__link-indicator для активного, підпис у nav__link-label. Див.
  @payloadcms/next/dist/elements/Nav/index.client.js. Копіюємо саме їх, щоб
  пункт не вибивався зі списку й не довелося тримати власні стилі.
*/
export const StatsNavLink = () => {
  const { config } = useConfig()
  const href = `${config.routes.admin}/statistics`
  const active = usePathname() === href

  return (
    <Link className="nav__link" href={href} id="nav-statistics" prefetch={false}>
      {active && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Звідки замовлення</span>
    </Link>
  )
}

export default StatsNavLink
