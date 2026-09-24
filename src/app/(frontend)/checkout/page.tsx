import type { Metadata } from 'next'

import { CheckoutForm } from '@/components/site/CheckoutForm'
import { accountCustomer } from '@/lib/account'
import { asDeliveryMethod, asPaymentMethod } from '@/lib/delivery'
import { getLocale } from '@/lib/locale'
import { siteSettings } from '@/lib/settings'

/*
  Дані покупця читаються на сервері, тому сторінка не може бути статичною.
  Раніше форма завжди починалась порожньою: людина вказувала телефон і адресу
  в кабінеті, приходила оформлювати — і вбивала те саме вдруге.
*/
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Оформлення',
  robots: { index: false },
}

const CheckoutPage = async () => {
  const [customer, settings] = await Promise.all([accountCustomer(), siteSettings(await getLocale())])

  return (
    <div className="shell page-y">
      <p className="label">Оформлення</p>
      <h1 className="mt-3 text-page">Ще один крок</h1>
      <div className="mt-12">
        <CheckoutForm
          prepayment={{
            type: settings?.prepaymentType ?? null,
            amount: settings?.prepaymentAmount ?? null,
          }}
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
