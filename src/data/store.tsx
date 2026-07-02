import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Creation = {
  id: string
  kind: 'video' | 'image'
  prompt: string
  engineId: string
  presetId: string
  aspect: string
  duration: number
  seedExtra: number
  createdAt: number
}

const KEY = 'nova.creations.v1'

type Store = {
  creations: Creation[]
  addCreation: (c: Creation) => void
  removeCreation: (id: string) => void
  clearAll: () => void
}

const Ctx = createContext<Store>(null!)

function load(): Creation[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [creations, setCreations] = useState<Creation[]>(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(creations))
  }, [creations])

  const value = useMemo<Store>(
    () => ({
      creations,
      addCreation: (c) => setCreations((prev) => [c, ...prev].slice(0, 200)),
      removeCreation: (id) => setCreations((prev) => prev.filter((c) => c.id !== id)),
      clearAll: () => setCreations([]),
    }),
    [creations],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
