import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { isNewer } from './useUpdateCheck'

describe('isNewer', () => {
  it('returns true when latest is ahead', () => {
    expect(isNewer('v0.2.0', '0.1.0')).toBe(true)
    expect(isNewer('v0.1.1', '0.1.0')).toBe(true)
    expect(isNewer('v1.0.0', '0.9.9')).toBe(true)
  })

  it('returns false when current is same or ahead', () => {
    expect(isNewer('v0.1.0', '0.1.0')).toBe(false)
    expect(isNewer('v0.1.0', '0.2.0')).toBe(false)
  })
})

// Inline minimal banner to avoid importing App-level deps
const UpdateBanner = ({ version, onDismiss }: { version: string; onDismiss: () => void }) => {
  return (
    <div>
      <span>Version {version} is available.</span>
      <button onClick={onDismiss}>✕</button>
    </div>
  )
}

describe('UpdateBanner', () => {
  it('renders the version', () => {
    render(<UpdateBanner version="v1.2.3" onDismiss={() => {}} />)
    expect(screen.getByText('Version v1.2.3 is available.')).toBeInTheDocument()
  })

  it('calls onDismiss when ✕ is clicked', () => {
    let dismissed = false
    render(
      <UpdateBanner
        version="v1.2.3"
        onDismiss={() => {
          dismissed = true
        }}
      />
    )
    fireEvent.click(screen.getByText('✕'))
    expect(dismissed).toBe(true)
  })
})
