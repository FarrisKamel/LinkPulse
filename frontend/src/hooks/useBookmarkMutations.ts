import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  type UpdateBookmarkInput,
  createBookmark,
  deleteBookmark,
  previewBookmark,
  updateBookmark,
} from '../api/bookmarks'
import { useToast } from '../components/Toast'

// Bookmark writes affect the list, tag counts, and dashboard stats.
function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
  queryClient.invalidateQueries({ queryKey: ['tags'] })
  queryClient.invalidateQueries({ queryKey: ['stats'] })
}

interface ToastMessages {
  successMessage?: string
  errorMessage?: string
}

export function usePreviewBookmark() {
  return useMutation({ mutationFn: previewBookmark })
}

export function useCreateBookmark(opts: ToastMessages = {}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: createBookmark,
    // Hook-level callbacks fire even if the caller unmounts mid-request.
    onSuccess: () => {
      invalidate(queryClient)
      if (opts.successMessage) toast.notify(opts.successMessage)
    },
    onError: () => {
      if (opts.errorMessage) toast.notify(opts.errorMessage, 'error')
    },
  })
}

export function useUpdateBookmark(opts: ToastMessages = {}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBookmarkInput }) =>
      updateBookmark(id, patch),
    onSuccess: () => {
      invalidate(queryClient)
      if (opts.successMessage) toast.notify(opts.successMessage)
    },
    onError: () => {
      if (opts.errorMessage) toast.notify(opts.errorMessage, 'error')
    },
  })
}

export function useDeleteBookmark(opts: ToastMessages = {}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () => {
      invalidate(queryClient)
      if (opts.successMessage) toast.notify(opts.successMessage)
    },
    onError: () => {
      if (opts.errorMessage) toast.notify(opts.errorMessage, 'error')
    },
  })
}
