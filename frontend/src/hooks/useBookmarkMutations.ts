import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  type UpdateBookmarkInput,
  createBookmark,
  deleteBookmark,
  previewBookmark,
  updateBookmark,
} from '../api/bookmarks'

export function usePreviewBookmark() {
  return useMutation({ mutationFn: previewBookmark })
}

export function useCreateBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBookmark,
    onSuccess: () => {
      // Invalidate every bookmarks query (all pages/filters) so the list
      // refetches and the new bookmark shows up.
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBookmarkInput }) =>
      updateBookmark(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}
