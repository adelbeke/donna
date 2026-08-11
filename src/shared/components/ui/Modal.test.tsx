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

  it('given transition is omitted, then no animation classes are added (existing call sites unchanged)', () => {
    const { baseElement } = render(
      <Modal isOpen title="Test" onClose={vi.fn()}>
        content
      </Modal>
    )
    expect(baseElement.innerHTML).not.toContain('animate-')
  })

  it('given transition is enabled, then the overlay and panel animate in under motion-safe', () => {
    const { baseElement } = render(
      <Modal isOpen title="Test" onClose={vi.fn()} transition>
        content
      </Modal>
    )
    const overlay = baseElement.querySelector('.fixed.inset-0.z-40')
    const panel = baseElement.querySelector('.pointer-events-auto')
    expect(overlay?.className).toContain('motion-safe:animate-overlay-in')
    expect(panel?.className).toContain('motion-safe:animate-panel-in')
  })
})
