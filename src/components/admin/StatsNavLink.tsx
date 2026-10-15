'use client'

import { Link, useConfig } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const GROUP = 'Продажі'

/*
  Пункт «Звідки замовлення» в бічному меню адмінки, у групі «Продажі».

  Payload до власної сторінки (admin.components.views) посилання НЕ додає — він
  реєструє лише адресу. Пункт кладеться окремо, через afterNavLinks.

  Чому пункт переносить себе сам, а не стоїть на місці. Групи меню Payload
  збирає ВИКЛЮЧНО з колекцій і глобалів (groupNavItems у @payloadcms/ui), а
  afterNavLinks малюється після всіх груп — тобто внизу, поза ними. Вставити
  свій пункт у чужу групу конфігом не можна; єдиний «чесний» шлях — замінити
  компонент Nav цілком, а це найчутливіша частина адмінки. Тому робимо як
  PasswordPeek на формі входу: малюємо себе, знаходимо потрібну групу й
  переїжджаємо в неї.

  Якщо групи немає (прав на «Замовлення» нема, або назву змінили) — пункт
  лишається там, де народився, внизу списку. Меню при цьому ціле.

  Розмітка й класи — ті самі, що в рідних пунктів Payload: nav__link, смужка
  nav__link-indicator для активного, підпис у nav__link-label. Див.
  @payloadcms/next/dist/elements/Nav/index.client.js.
*/
export const StatsNavLink = () => {
  const { config } = useConfig()
  const href = `${config.routes.admin}/statistics`
  const active = usePathname() === href

  useEffect(() => {
    const self = document.getElementById('nav-statistics')
    if (!self) return

    const group = [...document.querySelectorAll('.nav-group')].find(
      (node) => node.querySelector('.nav-group__label')?.textContent?.trim() === GROUP,
    )
    const content = group?.querySelector('.nav-group__content')
    if (content) content.append(self)

    // Початково пункт схований, щоб не блимнув унизу до переїзду.
    self.style.display = ''
  }, [])

  return (
    <Link
      className="nav__link"
      href={href}
      id="nav-statistics"
      prefetch={false}
      style={{ display: 'none' }}
    >
      {active && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Звідки замовлення</span>
    </Link>
  )
}

export default StatsNavLink
