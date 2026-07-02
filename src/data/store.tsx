import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Incident } from './types'
import { seedIncidents } from './seed'

const INCIDENTS_KEY = 'vigil.incidents.v1'
const SESSION_KEY = 'vigil.session.v1'

interface Store {
  incidents: Incident[]
  addIncident: (inc: Omit<Incident, 'id' | 'createdAt'>) => void
  setIncidentStatus: (id: string, status: Incident['status']) => void
  user: string | null
  signIn: (email: string) => void
  signOut: () => void
}

const StoreContext = createContext<Store | null>(null)

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(() => load(INCIDENTS_KEY, seedIncidents))
  const [user, setUser] = useState<string | null>(() => load(SESSION_KEY, null))

  useEffect(() => {
    localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents))
  }, [incidents])

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else localStorage.removeItem(SESSION_KEY)
  }, [user])

  const addIncident: Store['addIncident'] = (inc) => {
    setIncidents((prev) => {
      const maxNum = prev.reduce((m, i) => Math.max(m, parseInt(i.id.replace('INC-', ''), 10) || 0), 1000)
      return [{ ...inc, id: `INC-${maxNum + 1}`, createdAt: new Date().toISOString() }, ...prev]
    })
  }

  const setIncidentStatus: Store['setIncidentStatus'] = (id, status) => {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
  }

  return (
    <StoreContext.Provider
      value={{ incidents, addIncident, setIncidentStatus, user, signIn: setUser, signOut: () => setUser(null) }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}
