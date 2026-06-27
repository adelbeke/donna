import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PRCheckRow } from './PRCheckRow'
import type { CheckRunContext, StatusContextItem } from '@/types/github'

const checkRun: CheckRunContext = {
  __typename: 'CheckRun',
  name: 'CI / build',
  status: 'COMPLETED',
  conclusion: 'SUCCESS',
  detailsUrl: 'https://github.com/org/repo/runs/1',
}

const statusContext: StatusContextItem = {
  __typename: 'StatusContext',
  context: 'ci/circleci',
  state: 'SUCCESS',
  targetUrl: null,
}

describe('PRCheckRow', () => {
  it('GIVEN CheckRun with url WHEN rendered THEN shows name as a link', () => {
    render(<PRCheckRow check={checkRun} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', checkRun.detailsUrl)
    expect(screen.getByText('CI / build')).toBeInTheDocument()
  })

  it('GIVEN CheckRun with null url WHEN rendered THEN shows name without a link', () => {
    render(<PRCheckRow check={{ ...checkRun, detailsUrl: null }} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('CI / build')).toBeInTheDocument()
  })

  it('GIVEN StatusContext with null url WHEN rendered THEN shows context name without a link', () => {
    render(<PRCheckRow check={statusContext} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('ci/circleci')).toBeInTheDocument()
  })

  it('GIVEN StatusContext with url WHEN rendered THEN shows context name as a link', () => {
    render(<PRCheckRow check={{ ...statusContext, targetUrl: 'https://circleci.com/build/1' }} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://circleci.com/build/1')
    expect(screen.getByText('ci/circleci')).toBeInTheDocument()
  })

  it('GIVEN link present WHEN rendered THEN has noopener noreferrer', () => {
    render(<PRCheckRow check={checkRun} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
