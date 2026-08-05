import Link from 'next/link'

import { SubscribeForm } from '@/components/site/SubscribeForm'
import type { Setting } from '@/payload-types'

const columns = [
  {
    title: 'Курси',
    links: [
      { href: '/courses', title: 'Усі напрями' },
      { href: '/account', title: 'Мої доступи' },
      { href: '/delivery#access', title: 'Як я отримаю доступ' },
    ],
  },
  {
    title: 'Магазин',
    links: [
      { href: '/shop', title: 'Усі товари' },
      { href: '/shop?kits=1', title: 'Набори' },
      { href: '/delivery', title: 'Доставка й оплата' },
    ],
  },
  {
    title: 'Бренд',
    links: [
      { href: '/about', title: 'Про нас' },
      { href: '/reviews', title: 'Відгуки' },
      { href: '/journal', title: 'Журнал' },
    ],
  },
]

export const Footer = ({ settings }: { settings: Partial<Setting> | null }) => (
  <footer className="mt-24 border-t border-flax bg-paper-deep">
    <div className="shell py-16">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
        <div>
          <p className="font-display text-2xl tracking-[0.3em]">МК</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Прикраси ручної роботи та майстер-класи з вʼязання, бісероплетіння й макраме.
          </p>

          <div className="mt-8 max-w-sm">
            <p className="label">Новинки й знижки на пошту</p>
            <SubscribeForm />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="label">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="thread-link text-sm text-muted">
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <hr className="thread my-10" />

      <div className="flex flex-col gap-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} МК. ФОП, Україна.</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {settings?.instagram && (
            <a href={settings.instagram} className="thread-link" target="_blank" rel="noreferrer">
              Instagram
            </a>
          )}
          {settings?.telegram && (
            <a href={settings.telegram} className="thread-link" target="_blank" rel="noreferrer">
              Telegram
            </a>
          )}
          {settings?.phone && <a href={`tel:${settings.phone}`}>{settings.phone}</a>}
          <Link href="/offer" className="thread-link">
            Публічна оферта
          </Link>
        </div>
      </div>
    </div>
  </footer>
)
