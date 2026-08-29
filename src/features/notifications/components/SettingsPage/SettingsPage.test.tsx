import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsPage } from './SettingsPage'
import { useNotificationStore } from '../../stores/notificationStore'

beforeEach(() => {
  useNotificationStore.setState({
    enabledCategories: ['review-requested', 'assigned'],
    pollIntervalMs: 5 * 60_000,
    checksEnabled: { authored: false, assigned: false },
  })
})

describe('SettingsPage', () => {
  it('GIVEN both categories enabled WHEN rendered THEN both checkboxes are checked', () => {
    render(<SettingsPage />)

    expect(screen.getByLabelText('Notify me on new review requests')).toBeChecked()
    expect(screen.getByLabelText('Notify me when assigned')).toBeChecked()
  })

  it('GIVEN a checked category WHEN unchecked THEN it is removed from the store', () => {
    render(<SettingsPage />)

    fireEvent.click(screen.getByLabelText('Notify me on new review requests'))

    expect(useNotificationStore.getState().enabledCategories).toEqual(['assigned'])
  })

  it('GIVEN the interval select WHEN changed THEN the store updates', () => {
    render(<SettingsPage />)

    fireEvent.change(screen.getByLabelText('Check for new PRs every'), {
      target: { value: '60000' },
    })

    expect(useNotificationStore.getState().pollIntervalMs).toBe(60_000)
  })

  it('GIVEN checks notifications disabled WHEN the assigned CI checkbox is checked THEN only assigned is enabled', () => {
    render(<SettingsPage />)
    const [assignedChecks, authoredChecks] = screen.getAllByLabelText(
      'Notify me when CI passes or fails'
    )
    expect(assignedChecks).not.toBeChecked()
    expect(authoredChecks).not.toBeChecked()

    fireEvent.click(assignedChecks)

    expect(useNotificationStore.getState().checksEnabled).toEqual({
      assigned: true,
      authored: false,
    })
  })

  it('GIVEN checks notifications disabled WHEN the authored CI checkbox is checked THEN only authored is enabled', () => {
    render(<SettingsPage />)
    const [, authoredChecks] = screen.getAllByLabelText('Notify me when CI passes or fails')

    fireEvent.click(authoredChecks)

    expect(useNotificationStore.getState().checksEnabled).toEqual({
      assigned: false,
      authored: true,
    })
  })
})
