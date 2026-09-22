import Image from 'next/image'

import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { SubscribeForm } from '@/components/site/SubscribeForm'
import type { dictionary } from '@/lib/i18n'
import type { Setting } from '@/payload-types'

type Props = {
  settings: Partial<Setting> | null
  t: ReturnType<typeof dictionary>
}

/*
  Підвал за макетом (Figma «Підвал» 19:7 / «Підвал / Мобільний» 301:66).

  Десктоп: «Верх» на дві рівні половини (бренд + три колонки), під ним «Нитка»
  1px і «Низ» з копірайтом і контактами. Мобільний: усе в стовпець, колонки
  переносяться по дві в ряд.

  Дві описки в самому макеті обійдено за іменами шарів: шар «Набори» містить
  текст «Усі курси», а «Часті питання» — «Доставка й оплата». Іменам віримо,
  текстам ні.
*/
export const Footer = ({ settings, t }: Props) => {
  const columns = [
    {
      title: t.footer.columns.courses,
      links: [
        { href: '/courses', title: t.footer.links.allDirections },
        { href: '/account', title: t.footer.links.myAccess },
        { href: '/account/saved', title: t.footer.links.savedCourses },
      ],
    },
    {
      title: t.footer.columns.shop,
      links: [
        { href: '/shop/catalog', title: t.footer.links.allProducts },
        { href: '/shop/catalog?category=nabory', title: t.footer.links.kits },
        { href: '/delivery', title: t.footer.links.delivery },
      ],
    },
    {
      title: t.footer.columns.brand,
      links: [
        { href: '/about', title: t.footer.links.about },
        { href: '/journal', title: t.footer.links.journal },
        { href: '/faq', title: t.footer.links.faq },
        { href: '/offer', title: t.footer.offer },
        { href: '/privacy', title: t.footer.privacy },
      ],
    },
  ]

  return (
    <footer className="bg-paper-deep">
      <div className="shell flex flex-col gap-8 py-12 md:gap-10 md:py-20">
        <div className="flex flex-col gap-8 md:flex-row md:gap-20">
          <div className="flex flex-1 flex-col gap-3.5 md:gap-4">
            <Link href="/" className="w-fit">
              <Image
                src="/home/logo.png"
                alt="STAN_UA market"
                width={222}
                height={63}
                unoptimized
                className="h-[30px] w-[108px] md:h-9 md:w-32"
              />
            </Link>

            <p className="max-w-[280px] text-[13px] leading-[19.5px] text-muted">
              {t.footer.tagline}
            </p>

            <p className="label mt-1">{t.footer.subscribe}</p>
            <div className="md:max-w-[320px]">
              <SubscribeForm cta={t.footer.subscribeCta} done={t.footer.subscribed} />
            </div>
          </div>

          <div className="flex flex-1 flex-wrap gap-x-6 gap-y-8 md:gap-12">
            {columns.map((column) => (
              <div key={column.title} className="flex w-[155px] flex-col gap-3">
                <p className="label">{column.title}</p>
                {column.links.map((link) => (
                  <Link
                    key={`${column.title}-${link.title}`}
                    href={link.href}
                    className="thread-link text-[13px] leading-[19.5px] text-muted"
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <hr className="h-px border-0 bg-flax" />

        <div className="flex flex-col gap-2 text-[13px] leading-[19.5px] text-muted md:flex-row md:items-center md:justify-between md:gap-6">
          <p>© {new Date().getFullYear()} STAN_UA</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
          </div>
        </div>
      </div>
    </footer>
  )
}
