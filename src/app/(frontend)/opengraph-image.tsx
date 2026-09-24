import { ImageResponse } from 'next/og'

/**
 * Картинка для соцмереж. Малюється на льоту, тому лишається актуальною
 * без ручного експорту з Figma, і не тягне за собою зовнішніх зображень.
 */
export const alt = 'МК — прикраси ручної роботи та майстер-класи'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const Image = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FAF9F7',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 30, letterSpacing: 8, color: '#16150F' }}>STAN_UA</span>
          <span style={{ fontSize: 18, letterSpacing: 4, color: '#6E6A62' }}>
            ХЕНДМЕЙД-СТУДІЯ · УКРАЇНА
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 76, lineHeight: 1.05, color: '#16150F', letterSpacing: -2 }}>
            Прикраси ручної роботи.
          </span>
          <span style={{ fontSize: 76, lineHeight: 1.05, color: '#16150F', letterSpacing: -2 }}>
            І курси, щоб зробити свою.
          </span>
        </div>

        {/* Нитка, що розгалужується на три напрями — той самий підпис, що на сайті */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', width: 320, height: 1, background: '#A67C3D' }} />
          <span style={{ fontSize: 22, color: '#6E6A62' }}>
            Вʼязання · Бісероплетіння · Макраме
          </span>
        </div>
      </div>
    ),
    size,
  )

export default Image
