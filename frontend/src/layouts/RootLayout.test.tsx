import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { expect, test } from 'vitest'

import RootLayout from './RootLayout'

function renderShell() {
  const client = new QueryClient()
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<div>home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

test('renders sidebar nav links', () => {
  renderShell()
  expect(screen.getByRole('link', { name: 'Bookmarks' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Tags' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Dashboard' })).toBeTruthy()
})

test('renders topbar search and add button', () => {
  renderShell()
  expect(screen.getByPlaceholderText(/search bookmarks/i)).toBeTruthy()
  expect(screen.getByRole('button', { name: /add bookmark/i })).toBeTruthy()
})

test('mobile menu toggle opens and closes the drawer', () => {
  renderShell()
  expect(screen.queryByLabelText('Close menu')).toBeNull()
  fireEvent.click(screen.getByLabelText('Open menu'))
  expect(screen.getByLabelText('Close menu')).toBeTruthy()
  fireEvent.click(screen.getByLabelText('Close menu'))
  expect(screen.queryByLabelText('Close menu')).toBeNull()
})

test('the add bookmark button opens the modal', () => {
  renderShell()
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /add bookmark/i }))
  expect(screen.getByRole('dialog')).toBeTruthy()
})
