import { messengerLink } from '@/lib/messengers'

/*
  Спосіб видачі доступу до курсу — в одному місці.

  Те саме «чи є тут WhatsApp» читають чотири різні місця: лист після оплати,
  повторна видача посилання, кабінет і сторінка подяки. Поки це був просто
  `includes` у кожному з них, додати четвертий спосіб означало знайти всі
  чотири — і один таки загубився б.

  Значення 'both' лишилось від часів, коли способів було два. У списку воно
  підписане «Всі»: показує всі три поля, а надсилається те, що заповнене.
  Перейменувати саме значення дешево не можна — у PostgreSQL із переліку не
  прибрати те, що вже записане в курсах.
*/
export const withTelegram = ['telegram', 'both']
export const withCanva = ['canva', 'both']
export const withWhatsapp = ['whatsapp', 'both']

/**
 * Посилання на групу у WhatsApp — або null, якщо спосіб видачі її не
 * передбачає чи поле порожнє.
 *
 * Через `messengerLink`, бо клієнтка може вписати і номер замість посилання.
 */
export const whatsappGroup = (course: {
  accessType?: string | null
  whatsappUrl?: string | null
}): string | null =>
  withWhatsapp.includes(course.accessType ?? '') ? messengerLink(course.whatsappUrl, 'whatsapp') : null
