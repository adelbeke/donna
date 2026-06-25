import { createContext, useContext } from 'react'

export type Feature = 'branches'

const FeaturesContext = createContext<Set<Feature>>(new Set())

export const useFeatures = () => useContext(FeaturesContext)
export { FeaturesContext }
