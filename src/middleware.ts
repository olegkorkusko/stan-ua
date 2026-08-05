import { NextResponse, type NextRequest } from 'next/server'

/**
 * Англійська версія живе під /en, українська — в корені. Замість дублювання
 * дерева сторінок ми переписуємо /en/shop → /shop і кладемо мову в заголовок
 * запиту. Далі layout і сторінки читають її й запитують у Payload контент
 * потрібною мовою.
 */
export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl
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
  // Адмінка, API, статика й файли лишаються поза мовною логікою.
  matcher: ['/((?!admin|api|_next|media|favicon.ico|sitemap.xml|robots.txt).*)'],
}
