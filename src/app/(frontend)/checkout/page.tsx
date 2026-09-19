import type { Metadata } from 'next'

import { CheckoutForm } from '@/components/site/CheckoutForm'

export const metadata: Metadata = {
  title: 'Оформлення',
  robots: { index: false },
}

const CheckoutPage = () => (
  <div className="shell page-y">
    <p className="label">Оформлення</p>
    <h1 className="mt-3 text-page">Ще один крок</h1>
    <div className="mt-12">
      <CheckoutForm />
    </div>
  </div>
)

export default CheckoutPage
