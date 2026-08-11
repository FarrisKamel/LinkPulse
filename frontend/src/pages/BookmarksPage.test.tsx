import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import BookmarksPage from './BookmarksPage'

test('renders the Bookmarks heading', () => {
  render(<BookmarksPage />)
  // getByRole throws if no matching element exists, so this is a real
  // assertion; toBeTruthy just confirms the returned node.
  expect(screen.getByRole('heading', { name: 'Bookmarks' })).toBeTruthy()
})
