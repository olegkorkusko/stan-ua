import type { Field } from 'payload'

/** Транслітерація українських назв у придатний для URL слаг. */
const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ъ: '', ы: 'y', э: 'e',
  ё: 'e',
}

export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .split('')
    .map((ch) => (ch in MAP ? MAP[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

/**
 * Поле слага, що автоматично заповнюється з вказаного поля.
 * Клієнт нічого не вводить руками — але може перевизначити за потреби.
 */
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  label: 'Адреса сторінки',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'Заповнюється автоматично з назви. Змінюйте, тільки якщо розумієте наслідки для SEO.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.length > 0) return slugify(value)
        const source = data?.[from]
        if (typeof source === 'string' && source.length > 0) return slugify(source)
        return value
      },
    ],
  },
})
