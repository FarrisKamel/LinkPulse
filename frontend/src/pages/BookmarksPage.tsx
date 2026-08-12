import { useEffect, useState } from 'react'

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
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<Bookmark | null>(null)
  const { data, isPending, isError, refetch } = useBookmarks({
    limit: PAGE_SIZE,
    offset,
  })

  const total = data?.total ?? 0
  const hasPages = total > PAGE_SIZE

  // If the current page is past the end (e.g. deletions shrank the total),
  // clamp back to the last valid page instead of showing an empty grid.
  useEffect(() => {
    if (data && total > 0 && offset >= total) {
      setOffset(Math.floor((total - 1) / PAGE_SIZE) * PAGE_SIZE)
    }
  }, [data, total, offset])

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Bookmarks</h1>

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
          <p className="font-medium text-slate-700">No bookmarks yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Add your first link with the "Add Bookmark" button.
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
                Showing {offset + 1}&ndash;{Math.min(offset + PAGE_SIZE, total)}{' '}
                of {total}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={offset === 0}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium disabled:opacity-40 enabled:hover:bg-slate-100"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={offset + PAGE_SIZE >= total}
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
