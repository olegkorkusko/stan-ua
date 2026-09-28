import type { Metadata } from 'next'

import { CheckoutForm } from '@/components/site/CheckoutForm'
import { accountCustomer } from '@/lib/account'
import { asDeliveryMethod, asPaymentMethod } from '@/lib/delivery'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { siteSettings } from '@/lib/settings'

/*
  Дані покупця читаються на сервері, тому сторінка не може бути статичною.
  Раніше форма завжди починалась порожньою: людина вказувала телефон і адресу
  в кабінеті, приходила оформлювати — і вбивала те саме вдруге.
*/
export const dynamic = 'force-dynamic'

/*
  Заголовок вкладки й опис для пошуку залежать від мови, тому це функція,
  а не сталий обʼєкт: мова приходить із заголовка запиту.
*/
export const generateMetadata = async (): Promise<Metadata> => {
  // Службові сторінки в пошуку не потрібні — заборона індексації тут же.
  return { robots: { index: false }, title: dictionary(await getLocale()).meta.checkout }
}

const CheckoutPage = async () => {
  const [customer, settings] = await Promise.all([accountCustomer(), siteSettings(await getLocale())])
  const t = dictionary(await getLocale())

  return (
    <div className="shell page-y">
      <p className="label">{t.checkout.label}</p>
      <h1 className="mt-3 text-page">{t.checkout.title}</h1>
      <div className="mt-12">
        <CheckoutForm
          profile={
            customer && {
              name: customer.name ?? '',
              phone: customer.phone ?? '',
              email: customer.email,
              deliveryMethod: asDeliveryMethod(customer.deliveryMethod) ?? null,
              deliveryCity: customer.deliveryCity ?? '',
              deliveryBranch: customer.deliveryBranch ?? '',
              paymentMethod: asPaymentMethod(customer.paymentMethod) ?? null,
            }
          }
        />
      </div>
    </div>
  )
}

export default CheckoutPage
