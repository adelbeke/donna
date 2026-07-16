import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShortcutsManagerModal } from './ShortcutsManagerModal'
import { useShortcutStore } from '../../stores/shortcutStore'

beforeEach(() => {
  useShortcutStore.setState({ shortcuts: [] })
})

const renderModal = () => render(<ShortcutsManagerModal isOpen onClose={vi.fn()} />)

describe('ShortcutsManagerModal', () => {
  it('GIVEN no shortcuts WHEN rendered THEN shows empty state', () => {
    renderModal()
    expect(screen.getByText('No shortcuts defined yet')).toBeInTheDocument()
  })

  it('adding a shortcut appends a row', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByPlaceholderText('Shortcut name'), 'hello')
    await user.type(screen.getByPlaceholderText(/Comment text,/), 'LGTM')
    await user.click(screen.getByText('Add'))
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(useShortcutStore.getState().shortcuts).toHaveLength(1)
  })

  it('edit toggles inline form and Save persists via updateShortcut', async () => {
    useShortcutStore.getState().addShortcut({ name: 'hello', body: 'LGTM' })
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByTitle('Edit'))
    const nameInput = screen.getByDisplayValue('hello')
    await user.clear(nameInput)
    await user.type(nameInput, 'renamed')
    await user.click(screen.getByText('Save'))
    expect(useShortcutStore.getState().shortcuts[0]).toMatchObject({
      name: 'renamed',
      body: 'LGTM',
    })
    expect(screen.getByText('renamed')).toBeInTheDocument()
  })

  it('Cancel discards edits without persisting', async () => {
    useShortcutStore.getState().addShortcut({ name: 'hello', body: 'LGTM' })
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByTitle('Edit'))
    const nameInput = screen.getByDisplayValue('hello')
    await user.clear(nameInput)
    await user.type(nameInput, 'discarded')
    await user.click(screen.getByText('Cancel'))
    expect(useShortcutStore.getState().shortcuts[0]).toMatchObject({ name: 'hello' })
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('deleting a shortcut removes the row', async () => {
    useShortcutStore.getState().addShortcut({ name: 'hello', body: 'LGTM' })
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByTitle('Delete'))
    expect(screen.queryByText('hello')).not.toBeInTheDocument()
    expect(useShortcutStore.getState().shortcuts).toHaveLength(0)
  })
})
