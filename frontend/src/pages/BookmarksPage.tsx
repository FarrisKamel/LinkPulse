import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import BookmarkCard from '../components/BookmarkCard'
import BookmarkDetailDrawer from '../components/BookmarkDetailDrawer'
import { useBookmarks } from '../hooks/useBookmarks'
import type { Bookmark } from '../types'

const GRID = 'mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
const PAGE_SIZE = 20

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="aspect-video animate-pulse bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  )
}

function BookmarksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const tag = searchParams.get('tag') ?? ''
  const starred = searchParams.get('starred') === 'true'
  const hasFilters = Boolean(search || tag || starred)

  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<Bookmark | null>(null)

  // Reset to the first page the instant filters change. Done during render
  // (React's "adjust state on change" pattern) so the query below never fires
  // with new filters and a stale offset.
  const filterKey = `${search}|${tag}|${String(starred)}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setOffset(0)
  }
  const currentOffset = filterKey === prevFilterKey ? offset : 0

  const { data, isPending, isError, refetch } = useBookmarks({
    limit: PAGE_SIZE,
    offset: currentOffset,
    search: search || undefined,
    tag: tag || undefined,
    starred: starred || undefined,
  })

  const total = data?.total ?? 0
  const hasPages = total > PAGE_SIZE

  // Clamp a page that fell past the end (e.g. deletions shrank the total).
  useEffect(() => {
    if (data && total > 0 && currentOffset >= total) {
      setOffset(Math.floor((total - 1) / PAGE_SIZE) * PAGE_SIZE)
    }
  }, [data, total, currentOffset])

  function setParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Bookmarks</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setParam('starred', starred ? '' : 'true')}
          className={[
            'rounded-full border px-3 py-1 text-sm font-medium',
            starred
              ? 'border-amber-300 bg-amber-50 text-amber-700'
              : 'border-slate-300 text-slate-600 hover:bg-slate-100',
          ].join(' ')}
        >
          ★ Starred
        </button>
        {tag && (
          <span className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm text-indigo-700">
            Tag: {tag}
            <button
              type="button"
              aria-label="Clear tag filter"
              onClick={() => setParam('tag', '')}
              className="text-indigo-400 hover:text-indigo-700"
            >
              &times;
            </button>
          </span>
        )}
      </div>

      {isPending && (
        <div className={GRID} data-testid="bookmarks-loading">
          {Array.from({ length: 6 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Couldn't load bookmarks.{' '}
          <button
            type="button"
            onClick={() => refetch()}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {data && total === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-10 text-center">
          <p className="font-medium text-slate-700">
            {hasFilters ? 'No bookmarks match your filters' : 'No bookmarks yet'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {hasFilters
              ? 'Try clearing search or filters.'
              : 'Add your first link with the "Add Bookmark" button.'}
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className={GRID}>
            {data.items.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onOpen={setSelected}
                onFilterTag={(name) => setParam('tag', name)}
              />
            ))}
          </div>

          {selected && (
            <BookmarkDetailDrawer
              key={selected.id}
              bookmark={selected}
              onClose={() => setSelected(null)}
            />
          )}

          {hasPages && (
            <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
              <span>
                Showing {currentOffset + 1}&ndash;
                {Math.min(currentOffset + PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentOffset === 0}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium disabled:opacity-40 enabled:hover:bg-slate-100"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentOffset + PAGE_SIZE >= total}
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium disabled:opacity-40 enabled:hover:bg-slate-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default BookmarksPage
