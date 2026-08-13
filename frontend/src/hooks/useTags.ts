import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createTag, deleteTag, fetchTags, updateTag } from '../api/tags'
import { useToast } from '../components/Toast'

export function useTags() {
  return useQuery({ queryKey: ['tags'], queryFn: fetchTags, staleTime: 30_000 })
}

// Tag changes affect bookmark chips and dashboard stats too.
function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['tags'] })
  queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
  queryClient.invalidateQueries({ queryKey: ['stats'] })
}

interface ToastMessages {
  successMessage?: string
}

export function useCreateTag(opts: ToastMessages = {}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      invalidate(queryClient)
      if (opts.successMessage) toast.notify(opts.successMessage)
    },
  })
}

export function useUpdateTag(opts: ToastMessages = {}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: { name?: string; color?: string }
    }) => updateTag(id, patch),
    onSuccess: () => {
      invalidate(queryClient)
      if (opts.successMessage) toast.notify(opts.successMessage)
    },
  })
}

export function useDeleteTag(opts: ToastMessages = {}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      invalidate(queryClient)
      if (opts.successMessage) toast.notify(opts.successMessage)
    },
  })
}
