import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('given Escape is pressed, then onClose fires', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Modal isOpen title="Test" onClose={onClose}>
        content
      </Modal>
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('given size is full, then the dialog gets the full-screen classes', () => {
    const { baseElement } = render(
      <Modal isOpen title="Test" onClose={vi.fn()} size="full">
        content
      </Modal>
    )
    expect(baseElement.querySelector('.pointer-events-auto')?.className).toContain('w-[92vw]')
  })

  it('given size is omitted, then the dialog keeps the default classes', () => {
    const { baseElement } = render(
      <Modal isOpen title="Test" onClose={vi.fn()}>
        content
      </Modal>
    )
    expect(baseElement.querySelector('.pointer-events-auto')?.className).toContain('max-w-xl')
  })
})
