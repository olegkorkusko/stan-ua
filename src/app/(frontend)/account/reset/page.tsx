import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import type { Metadata } from 'next'

import { ResetForm } from '@/components/site/ResetForm'

/*
  Заголовок вкладки й опис для пошуку залежать від мови, тому це функція,
  а не сталий обʼєкт: мова приходить із заголовка запиту.
*/
export const generateMetadata = async (): Promise<Metadata> => {
  // Службові сторінки в пошуку не потрібні — заборона індексації тут же.
  return { robots: { index: false }, title: dictionary(await getLocale()).meta.reset }
}

type SearchParams = Promise<{ token?: string }>

const ResetPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { token } = await searchParams
  const t = dictionary(await getLocale()).common

  return (
    <div className="shell py-32">
      <p className="label text-center">{t.accountLabel}</p>
      <h1 className="mt-3 text-center text-page">{t.setPassword}</h1>
      <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-muted">
        Далі заходитимете з ним — або знову через посилання на пошту, як зручніше.
      </p>
      <div className="mt-10">
        <ResetForm token={token} />
      </div>
    </div>
  )
}

export default ResetPage
