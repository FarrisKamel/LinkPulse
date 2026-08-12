import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import AddBookmarkModal from './AddBookmarkModal'

function renderModal() {
  const client = new QueryClient()
  const onClose = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <AddBookmarkModal onClose={onClose} />
    </QueryClientProvider>,
  )
  return { onClose }
}

test('adds and removes tag chips', () => {
  renderModal()
  const input = screen.getByPlaceholderText(/add a tag/i)
  fireEvent.change(input, { target: { value: 'python' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(screen.getByText('python')).toBeTruthy()

  fireEvent.click(screen.getByLabelText('Remove python'))
  expect(screen.queryByText('python')).toBeNull()
})

test('save is disabled until a url is entered', () => {
  renderModal()
  const save = screen.getByRole('button', { name: 'Save' })
  expect(save).toHaveProperty('disabled', true)

  fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
    target: { value: 'https://x.test' },
  })
  expect(save).toHaveProperty('disabled', false)
})

test('escape closes the modal', () => {
  const { onClose } = renderModal()
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})
