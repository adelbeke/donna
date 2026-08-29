import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsPage } from './SettingsPage'
import { useNotificationStore } from '../../stores/notificationStore'

beforeEach(() => {
  useNotificationStore.setState({
    enabledCategories: ['review-requested', 'assigned'],
    pollIntervalMs: 5 * 60_000,
  })
})

describe('SettingsPage', () => {
  it('GIVEN both categories enabled WHEN rendered THEN both checkboxes are checked', () => {
    render(<SettingsPage />)

    expect(screen.getByLabelText('New review requests')).toBeChecked()
    expect(screen.getByLabelText('New PRs assigned to me')).toBeChecked()
  })

  it('GIVEN a checked category WHEN unchecked THEN it is removed from the store', () => {
    render(<SettingsPage />)

    fireEvent.click(screen.getByLabelText('New review requests'))

    expect(useNotificationStore.getState().enabledCategories).toEqual(['assigned'])
  })

  it('GIVEN the interval select WHEN changed THEN the store updates', () => {
    render(<SettingsPage />)

    fireEvent.change(screen.getByLabelText('Check for new PRs every'), {
      target: { value: '60000' },
    })

    expect(useNotificationStore.getState().pollIntervalMs).toBe(60_000)
  })
})
