import type { Metadata } from 'next'

import { AccountGuest } from '@/components/site/AccountGuest'
import { AccountShell, type AccountShellNodes } from '@/components/site/AccountShell'
import { ProductCard } from '@/components/site/ProductCard'
import { CourseCard, courseCardNodes } from '@/components/site/CourseCard'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { LogoutButton } from '@/components/site/LogoutButton'
import { accountCustomer } from '@/lib/account'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import type { Course, Product } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Збережені',
  robots: { index: false },
}

/*
  «Збережені» за макетом (137:2936 на 1440, 309:5044 на 390). У макеті
  розділ зветься «Збережені курси», але серце стоїть і на картках товарів,
  і вони теж потрапляють сюди — назва з макета вводила б в оману.

  Вміст вкладки — та сама «Картка курсу», що стоїть у каталозі, на напрямах
  і в пошуку; свого компонента тут немає й не треба. У макеті чотири картки
  в ряд по 322 (1360 мінус три проміжки по 24), на мобільному — колонка з
  кроком 32.

  Сітка, а не ряд: у макеті збережених рівно чотири, а в житті їх може бути
  скільки завгодно. `grid-cols-4` дає ті самі 322 на четвірці й спокійно
  переносить пʼяту картку на другий рядок, тоді як ряд без переносу
  стиснув би всі пʼять.
*/

const SHELL_NODES: AccountShellNodes = {
  root: '137:2936',
  heading: '137:2937',
  label: '137:2938',
  title: '137:2939',
  tabs: '137:2940',
  tabAccess: '137:2941',
  tabSaved: '137:2942',
  tabDelivery: '137:2943',
}

const CARD_NODES = ['137:3120', '137:3127', '137:3134', '137:3141']

const SavedCoursesPage = async () => {
  const t = dictionary(await getLocale())
  const customer = await accountCustomer()

  if (!customer) return <AccountGuest t={t} />

  const saved = (customer.savedCourses ?? []).filter(
    (item): item is Course => typeof item === 'object',
  )

  /*
    Товари теж зберігаються — серце стоїть і на їхніх картках, — але сторінка
    їх не показувала взагалі: читала лише savedCourses. Людина тиснула серце
    на браслеті, поверталась у «Збережені» й бачила порожньо.
  */
  const savedProducts = (customer.savedProducts ?? []).filter(
    (item): item is Product => typeof item === 'object',
  )
  const empty = saved.length === 0 && savedProducts.length === 0

  return (
    <AccountShell t={t} active="saved" nodes={SHELL_NODES} aside={<LogoutButton />}>
      {empty ? (
        <div className="border border-flax px-6 py-12 text-center">
          <p className="text-sm text-muted">{t.account.savedEmpty}</p>
          <Link href="/courses" className="btn btn-outline mt-6">
            {t.account.chooseCourse}
          </Link>
        </div>
      ) : (
        // Колонка на мобільному, ряд із перенесенням на десктопі — саме так
        // це описано в макеті, і звіряння дивиться на flex-direction. Ширина
        // картки рахується від четвірки з проміжками 24, тож пʼята спокійно
        // переходить на другий рядок замість того, щоб стиснути решту.
        <div
          data-figma-node="137:3119"
          className="flex flex-col gap-8 md:flex-row md:flex-wrap md:gap-6"
        >
          {saved.map((course, index) => (
            <div key={course.id} className="md:w-[calc((100%-72px)/4)]">
              <CourseCard
                course={course}
                directionSlug={
                  typeof course.direction === 'object' ? (course.direction?.slug ?? '') : ''
                }
                saved
                authorized
                nodes={CARD_NODES[index] ? courseCardNodes(CARD_NODES[index]) : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {savedProducts.length > 0 && (
        <div className="mt-8 flex flex-col gap-8 md:mt-6 md:flex-row md:flex-wrap md:gap-6">
          {savedProducts.map((product) => (
            <div key={product.id} className="md:w-[calc((100%-72px)/4)]">
              <ProductCard product={product} saved authorized />
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  )
}

export default SavedCoursesPage
