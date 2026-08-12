import BookmarkCard from '../components/BookmarkCard'
import { useBookmarks } from '../hooks/useBookmarks'

const GRID = 'mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'

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
  const { data, isPending, isError, refetch } = useBookmarks()

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

      {data && data.items.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-10 text-center">
          <p className="font-medium text-slate-700">No bookmarks yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Add your first link with the "Add Bookmark" button.
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className={GRID}>
          {data.items.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
      )}
    </div>
  )
}

export default BookmarksPage
