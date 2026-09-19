import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/*
  tailwind-merge знає лише типові класи Tailwind. Наші власні кеглі —
  `text-eyebrow`, `text-title`, `text-hero`, `text-page` — він приймає за колір
  тексту, бо вони теж починаються з `text-`. І тоді в парі `text-title text-ink`
  бачить конфлікт двох кольорів і мовчки лишає останній: кегль зникав, а
  заголовок падав до типових 16px.

  Тому перелічуємо їх явно як розміри шрифту. Заводиш новий `--text-*` у
  globals.css — додай його і сюди, інакше він так само зникне без жодної
  помилки.
*/
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['eyebrow', 'title', 'hero', 'page'] }],
    },
  },
})

/**
 * Склеює класи так, щоб пізніший переміг: `cn('px-4', 'px-6')` дає `px-6`.
 * Потрібен компонентам shadcn — вони приймають className ззовні й мусять
 * уміти перекрити власні класи, а не просто дописати поруч.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
