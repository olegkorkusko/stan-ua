import type { ReactNode } from 'react'

import { Tabs } from '@/components/site/Tabs'
import { ACCOUNT_ROUTES, type AccountTab } from '@/lib/account'
import type { dictionary } from '@/lib/i18n'

/*
  Оболонка кабінету за макетами 93:1928 (доступи), 137:2936 (збережені)
  і 138:3085 (дані для доставки). Три кадри відрізняються лише заголовком,
  активною вкладкою й вмістом — решта в них однакова до пікселя, тож живе тут.

  Кадр — це вся сторінка між шапкою й підвалом: 1440×1005 з падінгами 120/40
  на десктопі, 390 з падінгами 56/16 на мобільному. Саме ці числа дають
  `.shell` і `.page-y`, тому власних відступів тут немає.

  Ідентифікатори вузлів приходять пропом: у кожного з трьох кадрів вони свої,
  а перевірка parity шукає елемент за атрибутом саме еталонної ширини 1440.
*/

export type AccountShellNodes = {
  root: string
  heading: string
  label: string
  title: string
  tabs: string
  tabAccess: string
  tabSaved: string
  tabDelivery: string
}

type Props = {
  t: ReturnType<typeof dictionary>
  active: AccountTab
  nodes: AccountShellNodes
  /** Правий бік рядка заголовка: у макеті порожній, у нас там «Вийти». */
  aside?: ReactNode
  children: ReactNode
}

export const AccountShell = ({ t, active, nodes, aside, children }: Props) => {
  const tabs: { key: AccountTab; title: string; node: string }[] = [
    { key: 'access', title: t.account.tabs.access, node: nodes.tabAccess },
    { key: 'saved', title: t.account.tabs.saved, node: nodes.tabSaved },
    { key: 'delivery', title: t.account.tabs.delivery, node: nodes.tabDelivery },
  ]

  return (
    <div
      data-figma-node={nodes.root}
      data-figma-state="default"
      className="shell page-y flex flex-col gap-7 md:gap-14"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div data-figma-node={nodes.heading} className="flex flex-col gap-3">
          <p
            data-figma-node={nodes.label}
            className="text-[11px] font-semibold uppercase leading-[15px] tracking-[0.16em] text-muted"
          >
            {t.account.label.toUpperCase()}
          </p>
          <h1
            data-figma-node={nodes.title}
            className="font-display text-title font-normal text-ink md:text-[27px] md:leading-[31px]"
          >
            {t.account.tabs[active]}
          </h1>
        </div>
        {aside}
      </div>

      <Tabs
        items={tabs.map((tab) => ({
          key: tab.key,
          title: tab.title,
          href: ACCOUNT_ROUTES[tab.key],
          node: tab.node,
        }))}
        active={active}
        label={t.account.label}
        node={nodes.tabs}
      />

      {children}
    </div>
  )
}
