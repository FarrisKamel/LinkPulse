import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createTag, deleteTag, fetchTags, updateTag } from '../api/tags'

export function useTags() {
  return useQuery({ queryKey: ['tags'], queryFn: fetchTags, staleTime: 30_000 })
}

// Tag changes affect bookmark chips and dashboard stats too.
function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['tags'] })
  queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
  queryClient.invalidateQueries({ queryKey: ['stats'] })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => invalidate(queryClient),
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: { name?: string; color?: string }
    }) => updateTag(id, patch),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => invalidate(queryClient),
  })
}
