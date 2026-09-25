/**
 * Ціни форматуємо вручну, а не через Intl.NumberFormat: Node і браузер
 * використовують різні збірки ICU й ставлять різні пробіли перед «₴».
 * Через це React бачив розбіжність між сервером і клієнтом і не «оживляв»
 * сторінку — кошик і вибір варіацій мовчали.
 */
export const formatPrice = (value?: number | null): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  const rounded = Math.round(value)
  const grouped = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${rounded < 0 ? '-' : ''}${grouped} ₴`
}

/** «10 майстер-класів» / «11 майстер-класів» / «1 майстер-клас». */
export const plural = (count: number, one: string, few: string, many: string): string => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} ${one}`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} ${few}`
  return `${count} ${many}`
}

/*
  «14 вересня» — день і місяць без року, як у макеті картки статті.

  UTC-геттери навмисно: publishedAt приходить рядком дати без часу, тобто
  опівніччю UTC. На сервері західніше за Грінвіч локальні геттери показували б
  учорашнє число.
*/
export const formatDay = (value: string, months: string[]): string => {
  const date = new Date(value)
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]}`
}
