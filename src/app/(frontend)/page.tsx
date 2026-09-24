import Image from 'next/image'

import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'
import { imageUrl } from '@/lib/media'
import { payloadClient } from '@/lib/payload'
import { getLocale } from '@/lib/locale'

// Не `force-static`: сторінка читає мову з заголовка запиту — див. lib/locale.ts
export const dynamic = 'force-dynamic'

// Splash-портал. Дві гілки бренду (навчання і магазин) розходяться від
// центрального лого. Розмітка тримає layer-порядок Figma-фрейму (80:1375),
// щоб figma-parity бачив пряме відповідання нод.
//
// Висота: портал тягнеться на весь екран, інакше під ним лишається смуга фону.
// На десктопі мінімум у 900px тримає компоновку на низьких вікнах і дає рівно
// висоту Figma-фрейму в раннера, який завжди міряє при висоті 900.
//
// На мобільному тут стояли жорсткі 844px — висота кадру 390×844. Це збігалося
// рівно з одним апаратом: на будь-якому вищому екрані (iPhone 16 Pro Max — 956)
// під порталом лишалася біла смуга. 844 — це розмір телефона, на якому малювали
// макет, а не властивість екрана, тож жорстке число тут було хибним прочитанням
// макета. dvh дає ті самі 844 при перевірці на 390×844 і заповнює решту апаратів.
//
// Прокрутки на цій сторінці немає (overflow-hidden, вміст рівно у висоту), тож
// dvh не «дихає» разом зі згортанням адресного рядка — стрибати нема від чого.
const HomePage = async () => {
  const locale = await getLocale()
  const dict = dictionary(locale)
  const t = dict.portal

  /*
    Написи й фото гілок — з адмінки («Контент» → «Сторінка "Головна"»), а те,
    чого там ще немає, лишається з коду. Так сторінка не порожніє, поки
    клієнтка не дійшла до цього розділу.

    Фото окремо від текстів: у медіатеці лежить запис, а не рядок, тож
    imageUrl має розгорнути його у справжню адресу. Порожньо — файл із public.
  */
  const home = await payloadClient().then((payload) =>
    payload.findGlobal({ slug: 'home-page', locale, depth: 1 }).catch(() => null),
  )

  const learnImage = imageUrl(home?.learn?.image, 'wide') ?? '/home/learning.jpg'
  const shopImage = imageUrl(home?.shop?.image, 'wide') ?? '/home/finished-goods.jpg'

  return (
    <div
      data-figma-node="80:1375"
      data-figma-state="default"
      className="relative grid h-dvh w-full grid-rows-[1fr_4px_1fr] overflow-hidden bg-white md:min-h-[900px] md:grid-cols-[1fr_4px_1fr] md:grid-rows-none"
    >
      <PortalBranch
        href="/courses"
        label={home?.learn?.label || t.learnLabel}
        imageSrc={learnImage}
        imageAlt={home?.learn?.alt || t.learnAlt}
        variant="learn"
        panelNodeId="80:1379"
        buttonNodeId="283:4385"
        buttonTestId="portal-learn"
      />

      <div data-figma-node="172:4240" className="bg-white" aria-hidden="true" />

      <PortalBranch
        href="/shop"
        label={home?.shop?.label || t.shopLabel}
        imageSrc={shopImage}
        imageAlt={home?.shop?.alt || t.shopAlt}
        variant="shop"
        panelNodeId="80:1376"
        buttonNodeId="283:4395"
        buttonTestId="portal-shop"
      />

      {/* Лого перекриває межу двох панелей, тож мусить перехоплювати клік сам:
          інакше він провалюється на панель під ним і веде в магазин. */}
      <Link
        href="/"
        aria-label={dict.header.home}
        data-figma-node="80:1382"
        data-interaction-exempt="portal-logo-is-a-static-plate-in-design"
        className="absolute left-1/2 top-1/2 z-10 block -translate-x-1/2 -translate-y-1/2 md:top-[11%] md:translate-y-0"
      >
        <div
          data-figma-node="80:1383"
          className="relative flex items-center justify-center rounded-[2px] bg-white px-[19px] py-[16px] md:rounded-[3px] md:px-[26px] md:py-[21px]"
        >
          <Image
            data-figma-node="80:1384"
            src="/home/logo.png"
            alt={t.logoAlt}
            width={222}
            height={63}
            priority
            unoptimized
            className="h-auto w-[162px] md:w-[222px]"
          />
        </div>
      </Link>
    </div>
  )
}

type BranchProps = {
  href: string
  label: string
  imageSrc: string
  imageAlt: string
  variant: 'learn' | 'shop'
  panelNodeId: string
  buttonNodeId: string
  buttonTestId: string
}

const PortalBranch = ({
  href,
  label,
  imageSrc,
  imageAlt,
  variant,
  panelNodeId,
  buttonNodeId,
  buttonTestId,
}: BranchProps) => {
  // Прозорість кнопки у Figma різна: 36% для «Готові вироби», 26% для «Навчання».
  const buttonBg = variant === 'shop' ? 'bg-white/[.36]' : 'bg-white/[.26]'
  /*
    У макеті кнопки різного розміру — 209×48 і 162×48, — і обидві жорсткі.
    На телефоні це виглядало як помилка: напис змаленшав, а кнопка лишилась
    така сама, ще й сусідня інша завширшки.

    Тепер однакові й тягнуться разом з екраном: 150×36 на 390 → 209×48 на
    1220. Ширину беремо від більшої з двох — у «ГОТОВІ ВИРОБИ» найдовший
    напис, і він має поміститись.
  */
  const buttonSize =
    'w-[clamp(9.375rem,7.6423rem+7.1084vw,13.0625rem)] h-[clamp(2.25rem,1.8976rem+1.4458vw,3rem)]'
  // Кнопка «Навчання» у desktop-фреймі зсунута лівіше центру (250/719 = 34.77%),
  // «Готові вироби» — центрована. На mobile обидві по центру.
  const buttonPlacement =
    variant === 'learn'
      ? 'left-1/2 -translate-x-1/2 md:left-[34.77%] md:translate-x-0'
      : 'left-1/2 -translate-x-1/2'

  // Жива лише кнопка: і наведення, і перехід починаються з неї. Курсор над фото
  // нічого не рухає, клік по фото нікуди не веде.
  return (
    <div className="group relative overflow-hidden transition-[filter] duration-300 has-[[data-portal-cta]:hover]:brightness-[.95] motion-reduce:transition-none">
      <Image
        data-figma-node={panelNodeId}
        src={imageSrc}
        alt={imageAlt}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        priority
        unoptimized
        className="object-cover transition-transform duration-700 ease-out group-has-[[data-portal-cta]:hover]:scale-105 motion-reduce:transition-none motion-reduce:group-has-[[data-portal-cta]:hover]:scale-100"
      />
      {/* Дві градієнтні поволоки з Figma: темна зверху й глибша знизу. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 group-has-[[data-portal-cta]:hover]:opacity-80 motion-reduce:transition-none"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 55%), linear-gradient(to bottom, rgba(0,0,0,0) 28%, rgba(0,0,0,0.98) 100%)',
        }}
      />

      {/*
        Позиціювання винесене на обгортку, а не лишилось на самій кнопці, і це
        не косметика: центрування по вертикалі — це -translate-y-1/2, а натиск
        кнопки — active:translate-y-px. На одному елементі друге затирає перше,
        і кнопка при кліку підстрибувала б на пів своєї висоти вгору замість
        зсуву на піксель вниз.

        Відхід від макета, свідомий. Там кнопка стоїть на 44.29% висоти
        (mobile) і 47.33% (desktop) — але це відсоток від кадру фіксованої
        висоти. На живому екрані він їде: на низькому ноутбуці кнопка
        притискається догори, на високому моніторі провисає.
      */}
      <div className={`absolute top-1/2 -translate-y-1/2 ${buttonPlacement}`}>
        <Link
          href={href}
          data-figma-node={buttonNodeId}
          data-testid={buttonTestId}
          data-portal-cta=""
          className={`${buttonSize} inline-flex items-center justify-center rounded-[2px] text-ink transition-[background-color,transform] duration-300 ${buttonBg} hover:bg-white/70 active:translate-y-px motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/70`}
        >
          {/* 10 px на 390 → 15 px на 1220. Формула проєкту: нахил (15−10)/830. */}
          <span className="text-[clamp(0.625rem,0.4782rem+0.6024vw,0.9375rem)] font-semibold leading-[1.2] tracking-normal">
            {label}
          </span>
        </Link>
      </div>
    </div>
  )
}

export default HomePage
