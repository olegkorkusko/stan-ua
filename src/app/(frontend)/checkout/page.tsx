import type { Metadata } from 'next'

import { CheckoutForm } from '@/components/site/CheckoutForm'

export const metadata: Metadata = {
  title: 'Оформлення',
  robots: { index: false },
}

const CheckoutPage = () => (
  <div className="shell pb-24 pt-28 md:pt-36">
    <p className="label">Оформлення</p>
    <h1 className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)]">Ще один крок</h1>
    <div className="mt-12">
      <CheckoutForm />
    </div>
  </div>
)

export default CheckoutPage
