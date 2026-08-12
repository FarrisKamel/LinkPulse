import { type KeyboardEvent, useEffect, useRef, useState } from 'react'

import {
  useCreateBookmark,
  usePreviewBookmark,
} from '../hooks/useBookmarkMutations'

interface AddBookmarkModalProps {
  onClose: () => void
}

function AddBookmarkModal({ onClose }: AddBookmarkModalProps) {
  const [url, setUrl] = useState('')
  const [fetchedUrl, setFetchedUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const urlRef = useRef<HTMLInputElement>(null)

  const preview = usePreviewBookmark()
  const create = useCreateBookmark()

  useEffect(() => {
    urlRef.current?.focus()
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function addTag() {
    const value = tagInput.trim()
    if (value && !tags.includes(value)) {
      setTags((prev) => [...prev, value])
    }
    setTagInput('')
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  function handleSave() {
    if (!url.trim()) return
    // Include a tag that was typed but not yet committed with Enter.
    const pending = tagInput.trim()
    const finalTags =
      pending && !tags.includes(pending) ? [...tags, pending] : tags
    create.mutate(
      { url: url.trim(), tags: finalTags },
      { onSuccess: onClose },
    )
  }

  // Show the preview only when it's settled AND still matches the URL in the
  // field. Hiding it while a fetch is in flight prevents a previous result
  // from briefly rendering against the new URL.
  const meta =
    preview.data && !preview.isPending && fetchedUrl === url.trim()
      ? preview.data
      : null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-bookmark-title"
        className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
      >
        <h2
          id="add-bookmark-title"
          className="text-lg font-semibold text-slate-900"
        >
          Add bookmark
        </h2>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          URL
        </label>
        <div className="mt-1 flex gap-2">
          <input
            ref={urlRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <button
            type="button"
            onClick={() => {
              const target = url.trim()
              if (target) {
                setFetchedUrl(target)
                preview.mutate(target)
              }
            }}
            disabled={!url.trim() || preview.isPending}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            {preview.isPending ? 'Fetching…' : 'Fetch'}
          </button>
        </div>
        {preview.isError && (
          <p className="mt-1 text-xs text-red-600">Couldn't fetch that URL.</p>
        )}

        {meta && (
          <div className="mt-4 flex gap-3 rounded-lg border border-slate-200 p-3">
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-slate-100">
              {meta.og_image_url && (
                <img
                  src={meta.og_image_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {meta.title || meta.domain || meta.url}
              </p>
              {meta.domain && (
                <p className="truncate text-xs text-slate-500">{meta.domain}</p>
              )}
            </div>
          </div>
        )}

        <label className="mt-4 block text-sm font-medium text-slate-700">
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
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
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

        {create.error && (
          <p className="mt-3 text-sm text-red-600">{create.error.message}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!url.trim() || create.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {create.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddBookmarkModal
