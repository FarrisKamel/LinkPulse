import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createBookmark, previewBookmark } from '../api/bookmarks'

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
