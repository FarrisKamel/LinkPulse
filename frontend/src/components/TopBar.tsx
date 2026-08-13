import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'

interface TopBarProps {
  /** Open the mobile sidebar drawer (hamburger button). */
  onMenuClick: () => void
  /** Open the Add Bookmark modal. */
  onAddClick: () => void
}

function TopBar({ onMenuClick, onAddClick }: TopBarProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlSearch = searchParams.get('search') ?? ''
  const [term, setTerm] = useState(urlSearch)
  // Tracks the last value we wrote to the URL, so the sync-from-URL effect
  // below can tell an external navigation apart from our own debounced write.
  const lastWritten = useRef(urlSearch)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cmd/Ctrl+K focuses the search box.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Debounce: push the term into the URL's ?search= 300ms after typing stops,
  // so the bookmark query isn't refetched on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      lastWritten.current = term
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (term) next.set('search', term)
          else next.delete('search')
          return next
        },
        { replace: true },
      )
    }, 300)
    return () => clearTimeout(id)
  }, [term, setSearchParams])

  // Keep the input in sync when the URL changes externally (back/forward).
  // Guarded by lastWritten so in-progress typing isn't clobbered.
  useEffect(() => {
    if (urlSearch !== lastWritten.current) {
      lastWritten.current = urlSearch
      setTerm(urlSearch)
    }
  }, [urlSearch])

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
        ref={inputRef}
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search bookmarks…  (⌘K)"
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
