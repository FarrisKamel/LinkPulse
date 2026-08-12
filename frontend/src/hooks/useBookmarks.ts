import { useQuery } from '@tanstack/react-query'

import { type BookmarkListParams, fetchBookmarks } from '../api/bookmarks'

export function useBookmarks(params: BookmarkListParams = {}) {
  return useQuery({
    // params in the key so different filters/pages cache separately (LP-13).
    queryKey: ['bookmarks', params],
    queryFn: () => fetchBookmarks(params),
    // Stale-while-revalidate: serve cached data for 30s, refetch in background.
    staleTime: 30_000,
  })
}
