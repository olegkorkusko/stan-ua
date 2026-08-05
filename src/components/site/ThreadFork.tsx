'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Підпис проєкту: одна нитка приходить згори й розгалужується на три напрями.
 * Вʼязання, бісероплетіння й макраме — різні техніки, але нитка спільна.
 * На кінці кожної гілки — бісерина над карткою напряму.
 *
 * Лінія намальована за замовчуванням: анімація лише програється, коли блок
 * зʼявляється в полі зору. Якщо JS не відпрацював, нитка все одно на місці.
 */
const BRANCHES = [
  { d: 'M600 46 C 600 120, 200 98, 200 156', x: 200, delay: 0.3 },
  { d: 'M600 46 V156', x: 600, delay: 0.4 },
  { d: 'M600 46 C 600 120, 1000 98, 1000 156', x: 1000, delay: 0.5 },
]

export const ThreadFork = () => {
  const ref = useRef<SVGSVGElement>(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <svg
      ref={ref}
      viewBox="0 0 1200 160"
      preserveAspectRatio="none"
      className="hidden h-32 w-full md:block"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        className="text-ink/40"
      >
        <path
          d="M600 0 V46"
          pathLength={1}
          className={drawn ? 'thread-draw' : undefined}
          style={{ animationDelay: '0.05s' }}
        />
        {BRANCHES.map((branch) => (
          <path
            key={branch.x}
            d={branch.d}
            pathLength={1}
            className={drawn ? 'thread-draw' : undefined}
            style={{ animationDelay: `${branch.delay}s` }}
          />
        ))}
      </g>

      {BRANCHES.map((branch) => (
        <circle
          key={branch.x}
          cx={branch.x}
          cy={154}
          r={3.5}
          className={`fill-brass ${drawn ? 'bead-in' : ''}`}
          style={{ animationDelay: `${branch.delay + 0.8}s` }}
        />
      ))}
    </svg>
  )
}
