import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { describe, it, expect } from 'vitest'
import { RequireFeature } from './RequireFeature'
import { FeaturesContext, type Feature } from '@/shared/features'

const renderWithFeatures = (features: Set<Feature>) =>
  render(
    <FeaturesContext.Provider value={features}>
      <MemoryRouter initialEntries={['/branches']}>
        <Routes>
          <Route path="/prs" element={<div>prs page</div>} />
          <Route
            path="/branches"
            element={
              <RequireFeature feature="branches">
                <div>branches page</div>
              </RequireFeature>
            }
          />
        </Routes>
      </MemoryRouter>
    </FeaturesContext.Provider>
  )

describe('RequireFeature', () => {
  it('given the feature is enabled, when rendered, then renders children', () => {
    renderWithFeatures(new Set(['branches']))

    expect(screen.getByText('branches page')).toBeInTheDocument()
  })

  it('given the feature is disabled, when rendered, then redirects to /prs', () => {
    renderWithFeatures(new Set())

    expect(screen.getByText('prs page')).toBeInTheDocument()
    expect(screen.queryByText('branches page')).not.toBeInTheDocument()
  })
})
