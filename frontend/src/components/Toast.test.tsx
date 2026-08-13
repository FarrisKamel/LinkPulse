import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { ToastProvider, useToast } from './Toast'

function Trigger() {
  const { notify } = useToast()
  return (
    <button type="button" onClick={() => notify('Hello toast')}>
      go
    </button>
  )
}

test('shows a toast when notify is called', () => {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'go' }))
  expect(screen.getByText('Hello toast')).toBeTruthy()
})

test('useToast is a safe no-op without a provider', () => {
  render(<Trigger />)
  fireEvent.click(screen.getByRole('button', { name: 'go' }))
  expect(screen.queryByText('Hello toast')).toBeNull()
})
