import Image from 'next/image'

import { LocaleLink as Link } from '@/components/site/LocaleLink'

/*
  Картка статті за макетом (компонент 97:2: «Обкладинка» 97:3 і «Текст» 162:4
  з «Мета» 97:4, «Заголовок» 97:5 та «Анонс» 97:6).

  Той самий компонент стоїть у журналі (155:3610) і в секції «Журнал» на
  сторінці магазину (99:2189) — різниться лише ширина колонки: 432 у журналі,
  437 у магазині, 358 на мобільному.

  Висота обкладинки ФІКСОВАНА 320 px на всіх ширинах, а не пропорція: за
  пропорцією фото росло б разом із колонкою й у жодну з цих ширин не влучало.

  Текстовий блок теж фіксований — 151 px («Текст» у макеті має FIXED-висоту).
  Через це картки в ряду однакові незалежно від довжини заголовка, а не
  «скачуть» на пів рядка. Заголовок і анонс тому обрізані двома рядками:
  у макеті під них відведено рівно 44 і 40 px.

  Заголовок обмежений 295 px — це ширина текстового поля в самому компоненті,
  а не колонки. Рядок має рватися там, де намальовано, а не там, де скінчилася
  картка.

  Обведення в макеті намальоване ВСЕРЕДИНІ картки (stroke INSIDE): воно лягає
  поверх краю фото й не додає картці висоти. CSS-рамка, навпаки, додає 2 px,
  тому фото й текстовий блок підтягнуті під неї від'ємним полем — картка
  лишається 489, а лінія стоїть рівно там, де намальована.

  В один стовпчик (до 640) бічних рамок немає: там картка за рішенням замовника
  йде в край екрана, а лінія впритул до краю читається як недогляд верстки, а не
  як рамка. Лишаються верхня й нижня — вони й відділяють статті одну від одної.
  Сам вихід за поля робить сторінка: жолоб належить їй, а не картці. Від'ємні
  поля під бічну рамку тому теж вмикаються лише разом із нею, з sm.

  Це свідомий відхід від макета: там (303:4650) обкладинка 358 із відступом 16.

  Висоти рядків цілі (15, 22, 20), хоча в токенах 15.4, 21.76 і 19.5: Figma
  верстає текст у цілих коробках, і саме з них складено висоту кадру. З
  дробовими картка виходить на пікселі нижчою за макет.
*/

export type ArticleCardNodes = {
  root?: string
  cover?: string
  body?: string
  meta?: string
  title?: string
  excerpt?: string
}

type Props = {
  href: string
  title: string
  /** Рядок «ТЕГ · ДАТА» — уже готовий: картка не знає ні про теги, ні про дати. */
  meta: string
  excerpt?: string | null
  cover?: { src: string; alt: string } | null
  /** Вузли Figma еталонного кадру 1440. Без них картка просто не тегована. */
  nodes?: ArticleCardNodes
  sizes?: string
  priority?: boolean
}

export const ArticleCard = ({
  href,
  title,
  meta,
  excerpt,
  cover,
  nodes,
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  priority = false,
}: Props) => (
  <Link
    href={href}
    data-figma-node={nodes?.root}
    className="group flex flex-col gap-[18px] border-y border-edge transition-colors hover:border-ink sm:border"
  >
    <div className="relative -mt-px h-80 overflow-hidden bg-paper-deep sm:-mx-px">
      {cover ? (
        <Image
          data-figma-node={nodes?.cover}
          src={cover.src}
          alt={cover.alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={90}
          className="object-cover"
        />
      ) : (
        <div data-figma-node={nodes?.cover} className="weave h-full w-full" />
      )}
    </div>

    <div
      data-figma-node={nodes?.body}
      className="-mb-px flex h-[151px] flex-col gap-[18px] px-4 pb-4 sm:-mx-px"
    >
      <span
        data-figma-node={nodes?.meta}
        className="text-[11px] font-semibold uppercase leading-[15px] tracking-[0.16em] text-muted"
      >
        {meta}
      </span>
      <h2
        data-figma-node={nodes?.title}
        className="line-clamp-2 h-11 max-w-[295px] font-display text-[17px] font-normal leading-[22px] tracking-[-0.005em] text-ink"
      >
        {title}
      </h2>
      {excerpt && (
        <p
          data-figma-node={nodes?.excerpt}
          className="line-clamp-2 text-[13px] font-normal leading-5 text-muted"
        >
          {excerpt}
        </p>
      )}
    </div>
  </Link>
)
