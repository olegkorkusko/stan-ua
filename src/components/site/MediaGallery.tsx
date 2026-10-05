'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { NoPhoto } from '@/components/site/Picture'
import { useProductColor } from '@/components/site/ProductColor'

/**
 * Кадр слайдера. kind не обовʼязковий: сторінка курсу передає самі фото й
 * про відео не знає.
 */
export type GalleryImage = { src: string; alt: string; kind?: 'image' | 'video' }

/*
  Вертикальний слайдер фото. Стоїть і на сторінці товару (галерея 72:1300),
  і на сторінці курсу — тому назва не «товарна».

  Дві різні розкладки, бо в макеті вони справді різні.

  Десктоп — 72:1300: фото 681×782 і стовпчик крапок 7px праворуч (116:2366),
  вертикально, крок 72, активна під прозорістю 1, решта 0.22, усі кольору
  #16150F.

  Мобільний — 311:6208: фото на всю ширину 390×420 БЕЗ бічних полів, а крапки
  переїжджають ПІД нього — рядок 311:6210 по центру, крок 8. Бічних полів там
  немає навмисно: фото впирається в обидва краї екрана.

  На сторінці курсу в макеті слайдера немає — там одна обкладинка 720×780
  (32:253). Слайдер туди додано на прохання замовника.

  Гортання теж різне, бо різні пристрої:

    — мишею (десктоп) — колесом над фото, зсув стрічки translateY(-N × 100%),
      перехід 0.45s cubic-bezier(0.33, 1, 0.68, 1). На КРАЯХ колесо не
      перехоплюється — сторінка гортається далі, інакше в галереї застрягаєш.
      Так зроблено на mejuri — взірець, який дав замовник;
    — пальцем (мобільний) — звичайним горизонтальним скролом зі scroll-snap.
      Не своїми обробниками touchstart/touchmove: інерція, гумовий відскок на
      краях і перехоплення жесту системою — це те, що браузер уже вміє робити
      правильно, а ручний підрахунок пікселів завжди виходить дерев'яним.
      Нам лишається тільки прочитати scrollLeft і підсвітити потрібну крапку.

  Обидва режими ділять одну стрічку <ul>: усі фото вже в DOM, тож перемикання
  миттєве й без нового запиту за картинкою.

  Який зараз режим — питаємо не в matchMedia, а в самої стрічки: якщо вона
  прокручується вбік, значить, ми на мобільному. Так брейкпойнт лишається
  одним-єдиним, у класах, і не доводиться тримати його копію в JS.
*/

/* Кадр фото. Один на обидва стани — і коли фото є, і коли їх немає. */
const FRAME = 'relative w-full overflow-hidden bg-paper-deep aspect-390/420 md:aspect-681/782 md:w-auto md:flex-1'
export const MediaGallery = ({
  images,
  colorOf,
  emptyLabel,
  nodes,
}: {
  images: GalleryImage[]
  /**
   * Який кадр якому кольору належить: адреса файлу → id кольору. Обраний
   * колір приходить із контексту — свотчі стоять в іншій колонці.
   */
  colorOf?: Record<string, string>
  emptyLabel: string
  /**
   * Прив'язка до макета. У товару й курсу це різні вузли (72:1300/72:1385/116:2366
   * проти 32:253), тож номери приходять зі сторінки, а не зашиті тут — інакше
   * сторінка курсу успадкувала б товарні id і знімок парності зламався б.
   */
  nodes?: { frame?: string; photo?: string; dots?: string }
}) => {
  const { colorId } = useProductColor()

  /*
    Показуємо всі кадри. Раніше тут стояла стеля в шість — рівно стільки
    крапок намальовано в макеті. Але в «Прозорої Кризи» залито пʼятнадцять
    фото, у «Квіткового набору» дванадцять, і дев'ять із них просто ніхто
    не бачив.

    Замість стелі підлаштовуємо крок між крапками: шість стоять по макету,
    через 72 px, а далі крок стискається, щоб стовпчик не виліз за кадр.
    Рахунок від 640 px — це висота кадру з запасом на самі крапки.
  */
  const shown = images
  const count = shown.length
  const dotGap = count <= 6 ? 72 : Math.max(12, Math.floor((640 - count * 7) / (count - 1)))

  const [active, setActive] = useState(0)

  const frame = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLUListElement>(null)
  const lastSwitch = useRef(0)

  /*
    Обрали колір — слайдер перемотується на його кадр. Галерея при цьому
    лишається однією: решта фото нікуди не дівається, їх так само можна
    догортати. Так це працює в Etsy, на яку показував замовник.

    Кадру в цього кольору немає — не рухаємось: смикати слайдер на перше
    фото через те, що колір не підписали, гірше, ніж не робити нічого.

    Порівняння з попереднім кольором просто в рендері — саме так React радить
    підлаштовувати стан під зміну вхідних даних; в ефекті це був би зайвий
    прохід із уже намальованим старим кадром.
  */
  const target = colorId ? shown.findIndex((item) => colorOf?.[item.src] === colorId) : -1

  const [shownColor, setShownColor] = useState(colorId)
  if (colorId !== shownColor) {
    setShownColor(colorId)
    if (target >= 0) setActive(target)
  }

  // Стрічку на мобільному доводиться везти руками: свій scrollLeft вона
  // тримає сама, і це вже робота з DOM, тобто ефект.
  useEffect(() => {
    const element = track.current
    if (!element || target < 0) return
    if (element.scrollWidth > element.clientWidth + 1) {
      element.scrollTo({ left: target * element.clientWidth, behavior: 'smooth' })
    }
  }, [colorId, target])

  /** Стрічка прокручується вбік — отже, працює мобільна розкладка. */
  const swipeable = () => {
    const element = track.current
    return Boolean(element && element.scrollWidth > element.clientWidth + 1)
  }

  useEffect(() => {
    const element = frame.current
    if (!element || count < 2) return

    // Слухач вішаємо вручну з passive: false — React-івський onWheel пасивний,
    // і preventDefault у ньому не спрацює.
    const onWheel = (event: WheelEvent) => {
      // На мобільному гортає палець. Тачпад на вузькому екрані інакше
      // зсував би стрічку двічі: і скролом, і нашим лічильником.
      if (swipeable()) return

      const next = active + (event.deltaY > 0 ? 1 : -1)
      if (next < 0 || next >= count) return

      event.preventDefault()
      // Один рух колеса шле десятки подій; без паузи галерея проскакувала б
      // усі фото за раз.
      if (event.timeStamp - lastSwitch.current < 250) return
      lastSwitch.current = event.timeStamp
      setActive(next)
    }

    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [active, count])

  // Палець зупинив стрічку — лишається прочитати, на якому фото.
  const onScroll = () => {
    const element = track.current
    if (!element || !swipeable()) return
    const index = Math.round(element.scrollLeft / element.clientWidth)
    if (index !== active && index >= 0 && index < count) setActive(index)
  }

  const select = (index: number) => {
    const element = track.current
    if (element && swipeable()) {
      // Крапка на мобільному не перемикає стан, а везе стрічку — далі
      // спрацює onScroll, і підсвітка збіжиться з тим, що справді видно.
      element.scrollTo({ left: index * element.clientWidth, behavior: 'smooth' })
      return
    }
    setActive(index)
  }

  if (shown.length === 0) {
    return (
      <div data-figma-node={nodes?.frame} className="flex flex-col gap-4 md:flex-row md:gap-8">
        <div className={FRAME}>
          <NoPhoto />
        </div>
      </div>
    )
  }

  return (
    <div data-figma-node={nodes?.frame} className="flex flex-col gap-4 md:flex-row md:gap-8">
      <div ref={frame} data-figma-node={nodes?.photo} className={FRAME}>
        {/*
          Мобільний: горизонтальний скрол зі snap, власна смуга прокрутки
          схована — гортання показує саме фото, а не додаткову рисочку.
          Десктоп: скрол вимкнено, натомість зсув translateY через змінну
          --slide. Inline-стиль не можна ставити прямо в transform: він діяв
          би на всіх ширинах і тягнув би стрічку вбік ще й на мобільному,
          де її вже везе палець.
        */}
        <ul
          ref={track}
          onScroll={onScroll}
          style={{ '--slide': `-${active * 100}%` } as CSSProperties}
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:snap-none md:flex-col md:overflow-visible md:[transform:translateY(var(--slide))] md:transition-transform md:duration-[450ms] md:ease-[cubic-bezier(0.33,1,0.68,1)] md:will-change-transform md:motion-reduce:transition-none"
        >
          {shown.map((image, index) => (
            <li key={image.src} className="relative h-full w-full shrink-0 snap-center">
              {image.kind === 'video' ? (
                /*
                  З контролами й без автозапуску: у слайдері кадри гортають, і
                  ролик, який почав би грати сам, кричав би з-під пальця ще до
                  того, як на нього подивились. muted — щоб перший дотик до
                  «грати» не лякав звуком; увімкнути його можна там же.

                  preload="metadata" — щоб кадр не був порожнім до натискання,
                  але й щоб саме відео не тягнулось, поки його не попросили.
                */
                <video
                  src={image.src}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  aria-label={image.alt}
                  className="h-full w-full bg-ink object-cover"
                />
              ) : (
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              )}
            </li>
          ))}
        </ul>
      </div>

      {count > 1 && (
        <div
          data-figma-node={nodes?.dots}
          role="tablist"
          aria-label={emptyLabel}
          /* Крок задається змінною й лише на десктопі: на мобільному крапки
             стоять у рядок, там місця вистачає завжди. */
          style={{ '--dot-gap': `${dotGap}px` } as CSSProperties}
          className="flex justify-center gap-2 md:w-1.75 md:shrink-0 md:flex-col md:items-center md:justify-center md:[gap:var(--dot-gap)]"
        >
          {shown.map((image, index) => (
            <button
              key={image.src}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`${index + 1} / ${count}`}
              onClick={() => select(index)}
              /* Ціль кліку більша за саму крапку: 7px пальцем не влучити.
                 Від'ємні поля лишають крапку рівно 7px у розкладці.

                 По горизонталі беремо лише 4px: крок у макеті 7+8=15, тож
                 ширші цілі налазили б одна на одну, і тап по правому краю
                 крапки перемикав би на наступну. По вертикалі місця скільки
                 завгодно — там усі 10. */
              className="-mx-1 -my-2.5 px-1 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 md:-mx-2.5 md:px-2.5"
            >
              <span
                className={`block h-1.75 w-1.75 rounded-full bg-ink transition-opacity ${
                  index === active ? '' : 'opacity-22 hover:opacity-50'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
