export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'open' | 'investigating' | 'resolved'
export type GuardStatus = 'on-duty' | 'off-duty' | 'on-break'

export interface Incident {
  id: string
  title: string
  site: string
  severity: Severity
  status: IncidentStatus
  reportedBy: string
  notes: string
  createdAt: string // ISO
}

export interface Guard {
  id: string
  name: string
  role: string
  status: GuardStatus
  site: string | null
  licence: string
  phone: string
  shiftEnds: string | null
}

export interface Site {
  id: string
  name: string
  client: string
  address: string
  checkpoints: number
  checkpointsScanned: number
  guardsAssigned: number
  contractValue: number // NZD / month
  status: 'active' | 'onboarding'
}

export interface PatrolEvent {
  id: string
  kind: 'checkpoint' | 'incident' | 'shift-start' | 'shift-end' | 'welfare'
  guard: string
  site: string
  detail: string
  minutesAgo: number
}
