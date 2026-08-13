import { type KeyboardEvent, useEffect, useState } from 'react'

import {
  useDeleteBookmark,
  useUpdateBookmark,
} from '../hooks/useBookmarkMutations'
import type { Bookmark } from '../types'

interface BookmarkDetailDrawerProps {
  bookmark: Bookmark
  onClose: () => void
}

function BookmarkDetailDrawer({ bookmark, onClose }: BookmarkDetailDrawerProps) {
  const [starred, setStarred] = useState(bookmark.is_starred)
  const [notes, setNotes] = useState(bookmark.notes ?? '')
  const [tags, setTags] = useState<string[]>(bookmark.tags.map((t) => t.name))
  const [tagInput, setTagInput] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Separate mutation instances so a star toggle can't clear a failed save's
  // error state (they'd share isError/isPending if it were one instance).
  const save = useUpdateBookmark({
    successMessage: 'Changes saved',
    errorMessage: "Couldn't save changes",
  })
  const star = useUpdateBookmark()
  const remove = useDeleteBookmark({
    successMessage: 'Bookmark deleted',
    errorMessage: "Couldn't delete bookmark",
  })

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggleStar() {
    if (star.isPending) return // avoid overlapping, out-of-order updates
    const next = !starred
    setStarred(next)
    star.mutate(
      { id: bookmark.id, patch: { is_starred: next } },
      { onError: () => setStarred(!next) }, // revert optimistic change on failure
    )
  }

  function addTag() {
    const value = tagInput.trim()
    if (value && !tags.includes(value)) setTags((prev) => [...prev, value])
    setTagInput('')
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  function handleSave() {
    const pending = tagInput.trim()
    const finalTags =
      pending && !tags.includes(pending) ? [...tags, pending] : tags
    setTags(finalTags)
    setTagInput('')
    save.mutate({ id: bookmark.id, patch: { notes, tags: finalTags } })
  }

  function handleDelete() {
    remove.mutate(bookmark.id, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="animate-fade-in fixed inset-0 bg-slate-900/40"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Bookmark details"
        className="animate-slide-in-right relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Details</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="flex-1 space-y-5 px-5 py-5">
          {bookmark.og_image_url && (
            <img
              src={bookmark.og_image_url}
              alt=""
              className="aspect-video w-full rounded-lg object-cover"
            />
          )}

          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-slate-900">
                {bookmark.title || bookmark.domain || bookmark.url}
              </h3>
              <button
                type="button"
                onClick={toggleStar}
                disabled={star.isPending}
                aria-label={starred ? 'Unstar' : 'Star'}
                className={starred ? 'text-amber-400' : 'text-slate-300'}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill={starred ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path
                    d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.9l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76L10 2.5z"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {bookmark.domain && (
              <p className="mt-0.5 text-sm text-slate-500">{bookmark.domain}</p>
            )}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Visit site &rarr;
            </a>
          </div>

          {bookmark.description && (
            <p className="text-sm text-slate-600">{bookmark.description}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add a note…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tags
            </label>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 p-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    onClick={() =>
                      setTags((prev) => prev.filter((t) => t !== tag))
                    }
                    className="text-slate-400 hover:text-slate-700"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length ? '' : 'Add a tag, press Enter'}
                className="min-w-24 flex-1 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        <footer className="space-y-3 border-t border-slate-200 px-5 py-4">
          {save.isError && (
            <p className="text-sm text-red-600">
              Couldn't save changes. Please try again.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={save.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>

          {confirmingDelete ? (
            <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <span>Delete this bookmark?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={remove.isPending}
                  className="font-semibold text-red-700 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Delete bookmark
            </button>
          )}
        </footer>
      </aside>
    </div>
  )
}

export default BookmarkDetailDrawer
