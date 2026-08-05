import Image from 'next/image'
import Link from 'next/link'

import { formatPrice, plural } from '@/lib/format'
import { imageAlt, imageUrl } from '@/lib/media'
import type { Course } from '@/payload-types'

export const CourseCard = ({ course, directionSlug }: { course: Course; directionSlug: string }) => {
  const cover = imageUrl(course.cover, 'card')
  const lessons = course.lessons?.length ?? 0

  return (
    <article className="group">
      <Link href={`/courses/${directionSlug}/${course.slug}`} className="block">
        <div className="relative aspect-4/5 overflow-hidden bg-paper-deep">
          {cover ? (
            <Image
              src={cover}
              alt={imageAlt(course.cover, course.title)}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="weave h-full w-full transition-transform duration-700 group-hover:scale-105" />
          )}
          {course.oldPrice && (
            <span className="absolute left-3 top-3 bg-brass px-2 py-1 text-[0.625rem] uppercase tracking-[0.16em] text-paper">
              Акція
            </span>
          )}
        </div>

        <h3 className="mt-4 text-lg leading-snug">{course.title}</h3>
        {course.tagline && <p className="mt-1.5 text-sm text-muted">{course.tagline}</p>}

        <div className="mt-3 flex items-baseline gap-3">
          <span className="price text-brass">{formatPrice(course.price)}</span>
          {course.oldPrice && (
            <span className="text-xs text-muted line-through">{formatPrice(course.oldPrice)}</span>
          )}
          {lessons > 0 && (
            <span className="ml-auto text-xs text-muted">
              {plural(lessons, 'МК', 'МК', 'МК')}
            </span>
          )}
        </div>
      </Link>
    </article>
  )
}
