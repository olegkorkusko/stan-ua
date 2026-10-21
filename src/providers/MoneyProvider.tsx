'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { Money } from '@/lib/price'
import type { Region } from '@/lib/region'

/*
  Валюта показу й регіон покупця — для клієнтських компонентів.

  Серверні беруть їх самі: getRegion() і moneyFor(). А кошик, форма оформлення,
  шапка й кнопка купівлі — клієнтські, і протягувати ці два значення пропсами
  довелося б крізь півдесятка рівнів. Тому вони лежать у контексті поруч із
  мовою, одним провайдером на весь сайт.

  Регіон тут лише для ТЕКСТІВ («безкоштовна доставка») і для перемикача. Ціни
  клієнт не рахує: їх завжди віддає сервер — /api/cart для шухляди і
  /api/checkout для оплати. Інакше достатньо було б підправити cookie в
  браузері, щоб купити за внутрішньою ціною.
*/

type MoneyContext = { money: Money | null; region: Region }

const Context = createContext<MoneyContext>({ money: null, region: 'ua' })

export const MoneyProvider = ({
  money,
  region,
  children,
}: MoneyContext & { children: ReactNode }) => (
  <Context.Provider value={{ money, region }}>{children}</Context.Provider>
)

export const useMoney = () => useContext(Context)
