import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { SubscribeForm } from '@/components/site/SubscribeForm'
import type { dictionary } from '@/lib/i18n'
import type { Setting } from '@/payload-types'

type Props = {
  settings: Partial<Setting> | null
  t: ReturnType<typeof dictionary>
}

export const Footer = ({ settings, t }: Props) => {
  const columns = [
    {
      title: t.footer.columns.courses,
      links: [
        { href: '/courses', title: t.footer.links.allDirections },
        { href: '/account', title: t.footer.links.myAccess },
        { href: '/delivery', title: t.footer.links.howAccess },
      ],
    },
    {
      title: t.footer.columns.shop,
      links: [
        { href: '/shop', title: t.footer.links.allProducts },
        { href: '/shop?category=nabory', title: t.footer.links.kits },
        { href: '/delivery', title: t.footer.links.delivery },
      ],
    },
    {
      title: t.footer.columns.brand,
      links: [
        { href: '/about', title: t.footer.links.about },
        { href: '/journal', title: t.footer.links.journal },
        { href: '/offer', title: t.footer.offer },
      ],
    },
  ]

  return (
    <footer className="mt-24 border-t border-flax bg-paper-deep">
      <div className="shell py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <p className="font-display text-2xl tracking-[0.3em]">МК</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{t.footer.tagline}</p>

            <div className="mt-8 max-w-sm">
              <p className="label">{t.footer.subscribe}</p>
              <SubscribeForm cta={t.footer.subscribeCta} done={t.footer.subscribed} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="label">{column.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}`}>
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
              {t.footer.offer}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
