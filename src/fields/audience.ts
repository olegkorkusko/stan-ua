import type { Field } from 'payload'

import { AUDIENCE_HINT, audienceOptions } from '@/lib/audience'

/**
 * Мітка «Кому показувати» — однакова в товарі й курсі.
 *
 * Поруч зі «Статусом» у бічній панелі: обидва про те, чи побачить картку
 * покупець, і шукати їх природно в одному місці.
 */
export const audienceField = (): Field => ({
  name: 'audience',
  type: 'select',
  label: 'Кому показувати',
  defaultValue: 'all',
  options: audienceOptions,
  index: true,
  admin: { position: 'sidebar', description: AUDIENCE_HINT },
})
