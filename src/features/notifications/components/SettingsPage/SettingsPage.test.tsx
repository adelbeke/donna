import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SettingsPage } from './SettingsPage'
import { useNotificationStore } from '../../stores/notificationStore'

const renderSettingsPage = () =>
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  )

beforeEach(() => {
  useNotificationStore.setState({
    enabledCategories: ['review-requested', 'assigned'],
    pollIntervalMs: 5 * 60_000,
    checksEnabled: { authored: false, assigned: false },
    reviewLeftEnabled: { authored: false, assigned: false },
    soundName: 'Pop',
    silent: false,
  })
})

describe('SettingsPage', () => {
  it('GIVEN both categories enabled WHEN rendered THEN both checkboxes are checked', () => {
    renderSettingsPage()

    expect(screen.getByLabelText('Notify me on new review requests')).toBeChecked()
    expect(screen.getByLabelText('Notify me when assigned')).toBeChecked()
  })

  it('GIVEN a checked category WHEN unchecked THEN it is removed from the store', () => {
    renderSettingsPage()

    fireEvent.click(screen.getByLabelText('Notify me on new review requests'))

    expect(useNotificationStore.getState().enabledCategories).toEqual(['assigned'])
  })

  it('GIVEN the interval select WHEN changed THEN the store updates', () => {
    renderSettingsPage()

    fireEvent.change(screen.getByLabelText('Check for new PRs every'), {
      target: { value: '60000' },
    })

    expect(useNotificationStore.getState().pollIntervalMs).toBe(60_000)
  })

  it('GIVEN checks notifications disabled WHEN the assigned CI checkbox is checked THEN only assigned is enabled', () => {
    renderSettingsPage()
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
    renderSettingsPage()
    const [, authoredChecks] = screen.getAllByLabelText('Notify me when CI passes or fails')

    fireEvent.click(authoredChecks)

    expect(useNotificationStore.getState().checksEnabled).toEqual({
      assigned: false,
      authored: true,
    })
  })

  it('GIVEN review-left disabled for authored WHEN the checkbox is checked THEN only authored is enabled', () => {
    renderSettingsPage()

    fireEvent.click(screen.getByLabelText('Notify me when someone reviews my PR'))

    expect(useNotificationStore.getState().reviewLeftEnabled).toEqual({
      authored: true,
      assigned: false,
    })
  })

  it('GIVEN review-left disabled for assigned WHEN the checkbox is checked THEN only assigned is enabled', () => {
    renderSettingsPage()

    fireEvent.click(screen.getByLabelText('Notify me when someone reviews'))

    expect(useNotificationStore.getState().reviewLeftEnabled).toEqual({
      authored: false,
      assigned: true,
    })
  })

  it('GIVEN the sound select WHEN changed THEN the store updates', () => {
    renderSettingsPage()

    fireEvent.change(screen.getByLabelText('Notification sound'), {
      target: { value: 'Glass' },
    })

    expect(useNotificationStore.getState().soundName).toBe('Glass')
  })

  it('GIVEN silent unchecked WHEN toggled THEN the store updates and the sound controls disable', () => {
    renderSettingsPage()

    fireEvent.click(screen.getByLabelText('Silent (no sound)'))

    expect(useNotificationStore.getState().silent).toBe(true)
    expect(screen.getByLabelText('Notification sound')).toBeDisabled()
  })
})
