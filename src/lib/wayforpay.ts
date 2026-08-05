import crypto from 'crypto'

/**
 * WayForPay підписує кожен запит HMAC-MD5 по конкатенації полів через «;».
 * Порядок полів має значення — саме в такій послідовності, як у документації,
 * інакше платіж відхиляється з «Merchant signature is invalid».
 */
const sign = (fields: (string | number)[], secret: string): string =>
  crypto.createHmac('md5', secret).update(fields.join(';'), 'utf8').digest('hex')

export const PAY_URL = 'https://secure.wayforpay.com/pay'

export type PurchaseItem = { name: string; price: number; count: number }

export type PurchaseForm = Record<string, string | string[]>

export const buildPurchaseForm = ({
  orderReference,
  orderDate,
  amount,
  items,
  client,
  serviceUrl,
  returnUrl,
}: {
  orderReference: string
  orderDate: number
  amount: number
  items: PurchaseItem[]
  client: { firstName: string; email: string; phone: string }
  serviceUrl: string
  returnUrl: string
}): { url: string; fields: PurchaseForm } => {
  const merchantAccount = process.env.WAYFORPAY_MERCHANT_LOGIN ?? ''
  const secret = process.env.WAYFORPAY_MERCHANT_SECRET ?? ''
  const domain = new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000').hostname

  const names = items.map((item) => item.name)
  const counts = items.map((item) => String(item.count))
  const prices = items.map((item) => item.price.toFixed(2))
  const total = amount.toFixed(2)

  const signature = sign(
    [merchantAccount, domain, orderReference, orderDate, total, 'UAH', ...names, ...counts, ...prices],
    secret,
  )

  return {
    url: PAY_URL,
    fields: {
      merchantAccount,
      merchantDomainName: domain,
      merchantTransactionSecureType: 'AUTO',
      orderReference,
      orderDate: String(orderDate),
      amount: total,
      currency: 'UAH',
      productName: names,
      productCount: counts,
      productPrice: prices,
      clientFirstName: client.firstName,
      clientEmail: client.email,
      clientPhone: client.phone,
      language: 'UA',
      serviceUrl,
      returnUrl,
      merchantSignature: signature,
    },
  }
}

export type CallbackPayload = {
  merchantAccount: string
  orderReference: string
  amount: number
  currency: string
  authCode: string
  cardPan: string
  transactionStatus: string
  reasonCode: number | string
  merchantSignature: string
}

/** Колбек приймаємо тільки з валідним підписом — інакше замовлення можна «оплатити» підробленим запитом. */
export const verifyCallback = (payload: CallbackPayload): boolean => {
  const secret = process.env.WAYFORPAY_MERCHANT_SECRET ?? ''
  const expected = sign(
    [
      payload.merchantAccount,
      payload.orderReference,
      payload.amount,
      payload.currency,
      payload.authCode,
      payload.cardPan,
      payload.transactionStatus,
      payload.reasonCode,
    ],
    secret,
  )
  return expected === payload.merchantSignature
}

/** WayForPay чекає підписану відповідь, інакше повторює колбек ще кілька разів. */
export const buildCallbackResponse = (orderReference: string) => {
  const secret = process.env.WAYFORPAY_MERCHANT_SECRET ?? ''
  const time = Math.floor(Date.now() / 1000)
  return {
    orderReference,
    status: 'accept',
    time,
    signature: sign([orderReference, 'accept', time], secret),
  }
}

export const isConfigured = (): boolean =>
  Boolean(process.env.WAYFORPAY_MERCHANT_LOGIN && process.env.WAYFORPAY_MERCHANT_SECRET)
