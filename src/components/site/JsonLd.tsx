/**
 * Мікророзмітка для Google: у видачі показуються ціна, наявність і зірки
 * відгуків. Для магазину це помітно піднімає клікабельність.
 */
export const JsonLd = ({ data }: { data: Record<string, unknown> }) => (
  <script
    type="application/ld+json"
    // Дані формуються на сервері з нашої ж бази, стороннього вводу тут немає.
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
  />
)

export const productSchema = ({
  name,
  description,
  image,
  price,
  inStock,
  url,
  rating,
}: {
  name: string
  description?: string | null
  image?: string | null
  price: number
  inStock: boolean
  url: string
  rating?: { value: number; count: number } | null
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name,
  ...(description ? { description } : {}),
  ...(image ? { image } : {}),
  offers: {
    '@type': 'Offer',
    price,
    priceCurrency: 'UAH',
    availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url,
  },
  ...(rating && rating.count > 0
    ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: rating.value,
          reviewCount: rating.count,
        },
      }
    : {}),
})

export const courseSchema = ({
  name,
  description,
  price,
  url,
  lessons,
}: {
  name: string
  description?: string | null
  price: number
  url: string
  lessons: number
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name,
  ...(description ? { description } : {}),
  provider: { '@type': 'Organization', name: 'МК' },
  offers: { '@type': 'Offer', price, priceCurrency: 'UAH', url, category: 'Paid' },
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: `PT${lessons}H`,
  },
})
