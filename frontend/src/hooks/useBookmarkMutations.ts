import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  type UpdateBookmarkInput,
  createBookmark,
  deleteBookmark,
  previewBookmark,
  updateBookmark,
} from '../api/bookmarks'

// Bookmark writes can change tags and their counts, so refresh both lists.
function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
  queryClient.invalidateQueries({ queryKey: ['tags'] })
}

export function usePreviewBookmark() {
  return useMutation({ mutationFn: previewBookmark })
}

export function useCreateBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBookmark,
    onSuccess: () => invalidate(queryClient),
  })
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBookmarkInput }) =>
      updateBookmark(id, patch),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () => invalidate(queryClient),
  })
}
