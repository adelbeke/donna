import { describe, it, expect, beforeEach } from 'vitest'
import { useShortcutStore } from './shortcutStore'

beforeEach(() => {
  useShortcutStore.setState({ shortcuts: [] })
})

describe('shortcutStore', () => {
  it('addShortcut generates a non-empty id and appends', () => {
    useShortcutStore.getState().addShortcut({ name: 'lgtm', body: 'Looks good to me' })
    const { shortcuts } = useShortcutStore.getState()
    expect(shortcuts).toHaveLength(1)
    expect(shortcuts[0].id).toBeTruthy()
    expect(shortcuts[0]).toMatchObject({ name: 'lgtm', body: 'Looks good to me' })
  })

  it('addShortcut appends without clobbering existing shortcuts', () => {
    useShortcutStore.getState().addShortcut({ name: 'a', body: 'body a' })
    useShortcutStore.getState().addShortcut({ name: 'b', body: 'body b' })
    expect(useShortcutStore.getState().shortcuts).toHaveLength(2)
  })

  it('removeShortcut filters by id', () => {
    useShortcutStore.getState().addShortcut({ name: 'a', body: 'body a' })
    const id = useShortcutStore.getState().shortcuts[0].id
    useShortcutStore.getState().removeShortcut(id)
    expect(useShortcutStore.getState().shortcuts).toHaveLength(0)
  })

  it('updateShortcut patches name/body by id, leaves other shortcuts untouched', () => {
    useShortcutStore.getState().addShortcut({ name: 'a', body: 'body a' })
    useShortcutStore.getState().addShortcut({ name: 'b', body: 'body b' })
    const [idA, idB] = useShortcutStore.getState().shortcuts.map((s) => s.id)
    useShortcutStore.getState().updateShortcut(idA, { name: 'a2', body: 'body a2' })
    const { shortcuts } = useShortcutStore.getState()
    expect(shortcuts.find((s) => s.id === idA)).toMatchObject({ name: 'a2', body: 'body a2' })
    expect(shortcuts.find((s) => s.id === idB)).toMatchObject({ name: 'b', body: 'body b' })
  })

  it('updateShortcut is a no-op for an unknown id', () => {
    useShortcutStore.getState().addShortcut({ name: 'a', body: 'body a' })
    useShortcutStore.getState().updateShortcut('unknown-id', { name: 'z' })
    expect(useShortcutStore.getState().shortcuts).toMatchObject([{ name: 'a', body: 'body a' }])
  })
})
