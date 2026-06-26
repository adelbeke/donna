import { createContext, useContext } from 'react'

export type Feature = 'branches'

export const useFeatures = () => useContext(FeaturesContext)
export const FeaturesContext = createContext<Set<Feature>>(new Set())
