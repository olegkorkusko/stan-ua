'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const CONSENT_KEY = 'mk.consent.v1'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string }
    _fbq?: unknown
  }
}

/** Подія покупки/додавання в кошик — викликається з компонентів магазину. */
export const track = (event: string, params: Record<string, unknown> = {}) => {
  if (typeof window === 'undefined') return
  window.gtag?.('event', event, params)
  if (event === 'add_to_cart') window.fbq?.('track', 'AddToCart', params)
  if (event === 'begin_checkout') window.fbq?.('track', 'InitiateCheckout', params)
  if (event === 'purchase') window.fbq?.('track', 'Purchase', params)
}

/**
 * Лічильники вантажаться тільки після згоди — до неї жодного стороннього
 * скрипта на сторінці немає.
 */
export const Analytics = ({ ga, pixel }: { ga?: string; pixel?: string }) => {
  const [consent, setConsent] = useState<'unknown' | 'granted' | 'denied'>('unknown')

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY)
    if (stored === 'granted' || stored === 'denied') setConsent(stored)
  }, [])

  const decide = (value: 'granted' | 'denied') => {
    window.localStorage.setItem(CONSENT_KEY, value)
    setConsent(value)
  }

  if (!ga && !pixel) return null

  return (
    <>
      {consent === 'granted' && ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
              window.gtag=gtag;gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}

      {consent === 'granted' && pixel && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,
            'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}

      {consent === 'unknown' && (
        <div className="fixed inset-x-3 bottom-3 z-80 mx-auto max-w-2xl border border-flax bg-paper p-5 shadow-lg sm:inset-x-6 sm:bottom-6">
          <p className="text-sm leading-relaxed">
            Ми користуємось файлами cookie, щоб розуміти, які сторінки корисні, а які ні. Без вашої
            згоди жодні лічильники не вмикаються.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => decide('granted')} className="btn btn-primary">
              Погоджуюсь
            </button>
            <button type="button" onClick={() => decide('denied')} className="btn btn-outline">
              Тільки необхідні
            </button>
          </div>
        </div>
      )}
    </>
  )
}
