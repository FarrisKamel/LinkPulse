import { type FormEvent, useState } from 'react'

import { useToast } from '../components/Toast'
import {
  useCreateTag,
  useDeleteTag,
  useTags,
  useUpdateTag,
} from '../hooks/useTags'
import type { TagWithCount } from '../types'

function TagRow({ tag }: { tag: TagWithCount }) {
  const update = useUpdateTag()
  const remove = useDeleteTag()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tag.name)
  const [color, setColor] = useState(tag.color)
  const [confirming, setConfirming] = useState(false)

  function save() {
    if (!name.trim()) return
    update.mutate(
      { id: tag.id, patch: { name: name.trim(), color } },
      {
        onSuccess: () => {
          setEditing(false)
          toast.notify('Tag updated')
        },
      },
    )
  }

  if (editing) {
    return (
      <li className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3">
        <input
          type="color"
          aria-label="Tag color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-8 rounded"
        />
        <input
          aria-label="Tag name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <button
          type="button"
          onClick={save}
          disabled={update.isPending}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false)
            setName(tag.name)
            setColor(tag.color)
          }}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        {update.error && (
          <span className="w-full text-xs text-red-600">
            {update.error.message}
          </span>
        )}
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
      <span
        className="h-4 w-4 shrink-0 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
      <span className="font-medium text-slate-900">{tag.name}</span>
      <span className="text-sm text-slate-500">
        {tag.bookmark_count} bookmark{tag.bookmark_count === 1 ? '' : 's'}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Rename
        </button>
        {confirming ? (
          <span className="flex items-center gap-2 text-sm text-red-700">
            Delete?
            <button
              type="button"
              onClick={() =>
                remove.mutate(tag.id, {
                  onSuccess: () => toast.notify('Tag deleted'),
                })
              }
              disabled={remove.isPending}
              className="font-semibold disabled:opacity-40"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="font-medium text-slate-600"
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Delete
          </button>
        )}
      </div>
    </li>
  )
}

function TagsPage() {
  const { data: tags, isPending, isError } = useTags()
  const create = useCreateTag()
  const toast = useToast()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          setName('')
          setColor('#6366f1')
          toast.notify('Tag created')
        },
      },
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">Tags</h1>

      <form onSubmit={handleCreate} className="mt-4 flex items-center gap-2">
        <input
          type="color"
          aria-label="New tag color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-9 rounded"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New tag name"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <button
          type="submit"
          disabled={!name.trim() || create.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          Add tag
        </button>
      </form>
      {create.error && (
        <p className="mt-2 text-sm text-red-600">{create.error.message}</p>
      )}

      {isPending && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {isError && (
        <p className="mt-6 text-sm text-red-600">Couldn't load tags.</p>
      )}
      {tags && tags.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          No tags yet. Create one above.
        </p>
      )}
      {tags && tags.length > 0 && (
        <ul className="mt-6 space-y-2">
          {tags.map((tag) => (
            <TagRow key={tag.id} tag={tag} />
          ))}
        </ul>
      )}
    </div>
  )
}

export default TagsPage
