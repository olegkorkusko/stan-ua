import { NextResponse, type NextRequest } from 'next/server'

import { findRedirect } from '@/lib/redirects'

/**
 * Англійська версія живе під /en, українська — в корені. Замість дублювання
 * дерева сторінок ми переписуємо /en/shop → /shop і кладемо мову в заголовок
 * запиту. Далі layout і сторінки читають її й запитують у Payload контент
 * потрібною мовою.
 */
/*
  Кука авторизації в Payload одна на всі колекції — `payload-token`. Тому вхід
  у кабінет покупця на сайті перезаписує токен адміністратора, і навпаки.

  Далі виходило коло: адмінка бачила токен покупця, писала «немає доступу», а
  її кнопка «Вийти» стукала в logout колекції users, де цей токен не чинний.
  Кука лишалась, сторінка знову казала «немає доступу», і вийти було нічим.

  Тому чужий токен на /admin просто прибираємо й відправляємо на форму входу.
  Підпис не перевіряємо навмисно: ми нікого не впускаємо, лише викидаємо
  непридатну куку — найгірше, що станеться, це зайвий вхід у кабінет.
*/
const ADMIN_COLLECTION = 'users'

const collectionOf = (token: string): string | null => {
  const body = token.split('.')[1]
  if (!body) return null
  try {
    const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'))
    return (JSON.parse(json) as { collection?: string }).collection ?? null
  } catch {
    return null
  }
}

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const token = request.cookies.get('payload-token')?.value
    const collection = token ? collectionOf(token) : null

    if (collection && collection !== ADMIN_COLLECTION) {
      const target = request.nextUrl.clone()
      target.pathname = '/admin/login'
      target.search = ''
      const response = NextResponse.redirect(target)
      response.cookies.delete('payload-token')
      return response
    }

    return NextResponse.next()
  }

  // Старі адреси з weblium — постійним перенаправленням, щоб Google переніс
  // вагу сторінки на нову адресу, а не вважав її тимчасовою.
  const redirectTo = findRedirect(pathname)
  if (redirectTo) {
    const target = request.nextUrl.clone()
    target.pathname = redirectTo
    return NextResponse.redirect(target, 301)
  }

  const isEnglish = pathname === '/en' || pathname.startsWith('/en/')

  const headers = new Headers(request.headers)
  headers.set('x-locale', isEnglish ? 'en' : 'uk')
  headers.set('x-pathname', pathname)

  if (!isEnglish) return NextResponse.next({ request: { headers } })

  const url = request.nextUrl.clone()
  url.pathname = pathname.replace(/^\/en/, '') || '/'
  return NextResponse.rewrite(url, { request: { headers } })
}

export const config = {
  /*
    Адмінка сюди входить лише заради чужої куки — мовної логіки в ній немає,
    гілка вище повертає next() одразу. API, статика й файли не заходять зовсім.
  */
  matcher: ['/((?!api|_next|media|favicon.ico|sitemap.xml|robots.txt).*)'],
}
