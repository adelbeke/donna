import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/containers/AppLayout'
import { PRDashboard } from '@/features/pull-requests/exports'
import { BranchDashboard } from '@/features/branches/exports'
import { PRDetailPage } from '@/features/pr-review/exports'
import { RequireFeature } from '@/shared/components/RequireFeature/RequireFeature'

// HashRouter is mandatory: the packaged app loads renderer/index.html via file://, which
// BrowserRouter can't handle.
export const AppRouter = () => (
  <HashRouter>
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/prs" replace />} />
        <Route path="prs" element={<PRDashboard />} />
        <Route path="prs/:owner/:repo/:number" element={<PRDetailPage />} />
        <Route
          path="branches"
          element={
            <RequireFeature feature="branches">
              <BranchDashboard />
            </RequireFeature>
          }
        />
        <Route path="*" element={<Navigate to="/prs" replace />} />
      </Route>
    </Routes>
  </HashRouter>
)
