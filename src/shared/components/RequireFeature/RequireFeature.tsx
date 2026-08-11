import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router'
import { useFeatures, type Feature } from '@/shared/features'

type Props = PropsWithChildren & { feature: Feature }

export const RequireFeature = ({ feature, children }: Props) =>
  useFeatures().has(feature) ? children : <Navigate to="/prs" replace />
