import { useEffect, useState } from 'react'

import type { Bookmark } from '../types'

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.9l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76L10 2.5z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface BookmarkCardProps {
  bookmark: Bookmark
}

function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  // Recover if the image URL changes (e.g. after an edit) — a stale failure
  // from a previous URL shouldn't keep hiding a now-valid thumbnail.
  useEffect(() => {
    setImageFailed(false)
  }, [bookmark.og_image_url])
  const title = bookmark.title || bookmark.domain || bookmark.url
  const fallbackChar = (bookmark.domain || bookmark.url).charAt(0).toUpperCase()
  const showImage = bookmark.og_image_url && !imageFailed

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-video bg-slate-100">
        {showImage ? (
          <img
            src={bookmark.og_image_url ?? undefined}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-semibold text-slate-300">
            {fallbackChar}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-2 font-medium text-slate-900 hover:text-indigo-600"
          >
            {title}
          </a>
          <span
            className={bookmark.is_starred ? 'text-amber-400' : 'text-slate-300'}
            aria-label={bookmark.is_starred ? 'Starred' : 'Not starred'}
          >
            <StarIcon filled={bookmark.is_starred} />
          </span>
        </div>

        {bookmark.domain && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {bookmark.favicon_url && (
              <img
                src={bookmark.favicon_url}
                alt=""
                className="h-4 w-4 rounded"
              />
            )}
            <span className="truncate">{bookmark.domain}</span>
          </div>
        )}

        {bookmark.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {bookmark.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

export default BookmarkCard
