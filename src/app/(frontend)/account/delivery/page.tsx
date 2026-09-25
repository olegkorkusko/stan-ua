import type { Metadata } from 'next'

import { AccountGuest } from '@/components/site/AccountGuest'
import { AccountShell, type AccountShellNodes } from '@/components/site/AccountShell'
import { DeliveryProfile } from '@/components/site/DeliveryProfile'
import { LogoutButton } from '@/components/site/LogoutButton'
import { accountCustomer } from '@/lib/account'
import { asDeliveryMethod, asPaymentMethod } from '@/lib/delivery'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Дані для доставки',
  robots: { index: false },
}

/*
  «Дані для доставки» за макетом (138:3085 на 1440, 309:5406 на 390).

  Самі блоки живуть у клієнтському `DeliveryProfile` — через «Змінити», яке
  відкриває панель. Тут лишається тільки дістати профіль покупця й розкласти
  ідентифікатори вузлів.
*/

const SHELL_NODES: AccountShellNodes = {
  root: '138:3085',
  heading: '138:3086',
  label: '138:3087',
  title: '138:3088',
  tabs: '138:3089',
  tabAccess: '138:3090',
  tabSaved: '138:3091',
  tabDelivery: '138:3092',
}

const PROFILE_NODES = {
  section: '138:3268',
  blocks: [
    {
      root: '138:3269',
      label: '138:3270',
      rows: [
        { root: '138:3271', name: '138:3272', value: '138:3273' },
        { root: '138:3274', name: '138:3275', value: '138:3276' },
        { root: '138:3277', name: '138:3278', value: '138:3279' },
      ],
      edit: '138:3280',
    },
    {
      root: '138:3281',
      label: '138:3282',
      rows: [
        { root: '138:3283', name: '138:3284', value: '138:3285' },
        { root: '138:3286', name: '138:3287', value: '138:3288' },
        { root: '138:3289', name: '138:3290', value: '138:3291' },
      ],
      edit: '138:3292',
    },
    {
      root: '138:3293',
      label: '138:3294',
      rows: [
        { root: '138:3295', name: '138:3296', value: '138:3297' },
        { root: '138:3298', name: '138:3299', value: '138:3300' },
        { root: '138:3301', name: '138:3302', value: '138:3303' },
      ],
      edit: '138:3304',
    },
  ],
}

const DeliveryDataPage = async () => {
  const t = dictionary(await getLocale())
  const customer = await accountCustomer()

  if (!customer) return <AccountGuest t={t} />

  return (
    <AccountShell t={t} active="delivery" nodes={SHELL_NODES} aside={<LogoutButton />}>
      <DeliveryProfile
        nodes={PROFILE_NODES}
        values={{
          name: customer.name ?? '',
          phone: customer.phone ?? '',
          email: customer.email,
          deliveryMethod: asDeliveryMethod(customer.deliveryMethod) ?? null,
          deliveryCity: customer.deliveryCity ?? '',
          deliveryBranch: customer.deliveryBranch ?? '',
          paymentMethod: asPaymentMethod(customer.paymentMethod) ?? null,
          cardMask: customer.cardMask ?? '',
        }}
      />
    </AccountShell>
  )
}

export default DeliveryDataPage
