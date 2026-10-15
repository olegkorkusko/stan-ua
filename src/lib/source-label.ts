/**
 * Людська назва джерела замовлення.
 *
 * Збираємо з трьох шарів, від найточнішого до найзагальнішого:
 *
 * 1. `utm_source` — якщо посилання розмічене, це пряма відповідь;
 * 2. мітка кліку Facebook — її Meta дописує до посилання сама, навіть коли
 *    utm забули поставити. Тому реклама не губиться через недогляд у кабінеті;
 * 3. сайт, з якого перейшли, — для всього іншого.
 *
 * Домени зводимо до назви сервісу: Instagram шле переходи з трьох різних
 * доменів, і три рядки «l.instagram.com», «instagram.com», «lm.facebook.com»
 * у звіті довелося б складати очима.
 */

const KNOWN: [RegExp, string][] = [
  [/instagram/i, 'Instagram'],
  [/facebook|fb\.me|fb\.com/i, 'Facebook'],
  [/t\.me|telegram/i, 'Telegram'],
  [/google/i, 'Google'],
  [/bing|duckduckgo|yahoo/i, 'Інші пошуковики'],
  [/tiktok/i, 'TikTok'],
  [/pinterest/i, 'Pinterest'],
  [/youtube/i, 'YouTube'],
  [/weblium/i, 'Старий сайт'],
]

const prettify = (raw: string): string => {
  for (const [pattern, name] of KNOWN) if (pattern.test(raw)) return name
  // Лишається домен без www і без шляху — довгі посилання у звіті нечитабельні.
  const host = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0]
  return host || raw
}

export const sourceLabel = (order: {
  utmSource?: string | null
  utmCampaign?: string | null
  referrer?: string | null
  metaFbc?: string | null
}): string => {
  if (order.utmSource) return prettify(order.utmSource)
  if (order.metaFbc) return 'Реклама Meta'
  if (order.referrer) return prettify(order.referrer)
  return 'Прямий захід'
}
