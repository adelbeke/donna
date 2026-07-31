import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PRDescription } from './PRDescription'

describe('PRDescription', () => {
  it('given an empty body, when rendered, then renders nothing', () => {
    const { container } = render(<PRDescription body="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('given a whitespace-only body, when rendered, then renders nothing', () => {
    const { container } = render(<PRDescription body={'   \n  '} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('given a body, when rendered, then shows it collapsed behind a summary', () => {
    render(<PRDescription body="Fixes the thing that broke." />)
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Fixes the thing that broke.')).toBeInTheDocument()
  })
})
