import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { isAdmin } from '@/access'
import { broadcastToChannel } from '@/lib/telegram'

/**
 * Розсилка. Власниця пише лист в адмінці й ставить галочку «надіслати» —
 * жодних сторонніх сервісів і окремих паролів.
 *
 * Захист від випадкового повтору: після відправлення галочка знімається,
 * а дата фіксується. Уже надіслану розсилку вдруге не відправити.
 */
const send: CollectionAfterChangeHook = async ({ doc, previousDoc, req, operation }) => {
  if (!doc.send || doc.sentAt) return doc
  if (operation === 'update' && previousDoc?.sentAt) return doc

  const { payload } = req
  const recipients = new Set<string>()

  if (doc.audience === 'subscribers' || doc.audience === 'all') {
    const subscribers = await payload.find({
      collection: 'subscribers',
      where: { active: { equals: true } },
      limit: 1000,
      overrideAccess: true,
    })
    for (const item of subscribers.docs) recipients.add(item.email)
  }

  if (doc.audience === 'customers' || doc.audience === 'all') {
    const customers = await payload.find({ collection: 'customers', limit: 1000, overrideAccess: true })
    for (const item of customers.docs) recipients.add(item.email)
  }

  let sent = 0
  for (const email of recipients) {
    try {
      await payload.sendEmail({ to: email, subject: doc.subject, text: doc.body })
      sent += 1
    } catch (error) {
      payload.logger.error({ err: error, email }, 'Лист розсилки не пішов')
    }
  }

  if (doc.alsoTelegram) {
    await broadcastToChannel(`<b>${doc.subject}</b>\n\n${doc.body}`)
  }

  // req обовʼязковий: без нього оновлення піде в іншій транзакції й не побачить
  // щойно створений запис — Payload відповість 404.
  await payload.update({
    collection: 'broadcasts',
    id: doc.id,
    data: { send: false, sentAt: new Date().toISOString(), sentCount: sent },
    overrideAccess: true,
    req,
    context: { skipSend: true },
  })

  return doc
}

export const Broadcasts: CollectionConfig = {
  slug: 'broadcasts',
  labels: { singular: 'Розсилка', plural: 'Розсилки' },
  admin: {
    useAsTitle: 'subject',
    group: 'Продажі',
    defaultColumns: ['subject', 'audience', 'sentAt', 'sentCount'],
    description: 'Напишіть лист, поставте галочку «Надіслати» і збережіть.',
  },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    afterChange: [
      async (args) => {
        if (args.context?.skipSend) return args.doc
        return send(args)
      },
    ],
  },
  fields: [
    { name: 'subject', type: 'text', label: 'Тема листа', required: true },
    {
      name: 'body',
      type: 'textarea',
      label: 'Текст',
      required: true,
      admin: { rows: 10, description: 'Звичайний текст без розмітки — так лист не потрапляє в спам.' },
    },
    {
      name: 'audience',
      type: 'select',
      label: 'Кому',
      defaultValue: 'subscribers',
      options: [
        { label: 'Підписникам розсилки', value: 'subscribers' },
        { label: 'Покупцям', value: 'customers' },
        { label: 'Усім', value: 'all' },
      ],
    },
    {
      name: 'alsoTelegram',
      type: 'checkbox',
      label: 'Продублювати в Telegram-канал',
      defaultValue: false,
    },
    {
      name: 'send',
      type: 'checkbox',
      label: 'Надіслати при збереженні',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Знімається автоматично після відправлення.' },
    },
    {
      name: 'sentAt',
      type: 'date',
      label: 'Надіслано',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'sentCount',
      type: 'number',
      label: 'Отримувачів',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
