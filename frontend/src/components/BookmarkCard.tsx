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
  onOpen: (bookmark: Bookmark) => void
  onFilterTag: (name: string) => void
}

function BookmarkCard({ bookmark, onOpen, onFilterTag }: BookmarkCardProps) {
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
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Main clickable area opens the detail drawer. Tags are separate filter
          buttons below, so they aren't nested inside this button. */}
      <button
        type="button"
        onClick={() => onOpen(bookmark)}
        className="flex flex-1 flex-col text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/40"
      >
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

        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 font-medium text-slate-900">
              {title}
            </span>
            <span
              className={
                bookmark.is_starred ? 'text-amber-400' : 'text-slate-300'
              }
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
        </div>
      </button>

      {bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-4">
          {bookmark.tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onFilterTag(tag.name)}
              className="rounded-full px-2 py-0.5 text-xs font-medium hover:ring-1 hover:ring-inset"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

export default BookmarkCard
