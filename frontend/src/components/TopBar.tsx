import { useState } from 'react'

interface TopBarProps {
  /** Open the mobile sidebar drawer (hamburger button). */
  onMenuClick: () => void
  /** Open the Add Bookmark modal. */
  onAddClick: () => void
}

function TopBar({ onMenuClick, onAddClick }: TopBarProps) {
  // Local search state for now; LP-13 lifts this to drive the bookmark query.
  const [search, setSearch] = useState('')

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
      >
        {/* hamburger icon */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search bookmarks…"
        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      />

      <button
        type="button"
        onClick={onAddClick}
        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <span className="hidden sm:inline">Add Bookmark</span>
        <span className="sm:hidden">Add</span>
      </button>
    </header>
  )
}

export default TopBar
