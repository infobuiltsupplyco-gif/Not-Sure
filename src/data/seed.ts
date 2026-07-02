import type { Incident, Guard, Site, PatrolEvent } from './types'

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

export const seedIncidents: Incident[] = [
  {
    id: 'INC-1042',
    title: 'Forced entry attempt — rear loading dock',
    site: 'Westfield Riccarton',
    severity: 'critical',
    status: 'investigating',
    reportedBy: 'Tane Whaitiri',
    notes: 'Pry marks on roller door. Police notified, scene secured. CCTV footage exported for the 22:10–22:40 window.',
    createdAt: hoursAgo(3),
  },
  {
    id: 'INC-1041',
    title: 'Intoxicated trespasser refusing to leave',
    site: 'Commercial Bay',
    severity: 'high',
    status: 'resolved',
    reportedBy: 'Sione Tuilagi',
    notes: 'Individual escorted off premises without force. Trespass notice issued and logged with centre management.',
    createdAt: hoursAgo(7),
  },
  {
    id: 'INC-1040',
    title: 'Fire alarm activation — level 3 plant room',
    site: 'ANZ Centre',
    severity: 'high',
    status: 'resolved',
    reportedBy: 'Priya Sharma',
    notes: 'False alarm caused by dust during contractor works. FENZ attended, building cleared to reoccupy at 14:32.',
    createdAt: hoursAgo(11),
  },
  {
    id: 'INC-1039',
    title: 'Vehicle blocking emergency exit',
    site: 'Sylvia Park',
    severity: 'medium',
    status: 'resolved',
    reportedBy: 'Marcus Chen',
    notes: 'Owner located via plate lookup, vehicle moved within 20 minutes. Reminder signage requested.',
    createdAt: hoursAgo(26),
  },
  {
    id: 'INC-1038',
    title: 'Graffiti on east stairwell',
    site: 'Britomart Precinct',
    severity: 'low',
    status: 'open',
    reportedBy: 'Aroha Ngata',
    notes: 'Photographed and reported to facilities for removal. Added to hotspot watch list for night patrols.',
    createdAt: hoursAgo(31),
  },
  {
    id: 'INC-1037',
    title: 'Slip hazard — burst pipe in car park B2',
    site: 'ANZ Centre',
    severity: 'medium',
    status: 'resolved',
    reportedBy: 'Priya Sharma',
    notes: 'Area coned off immediately, facilities isolated the water main. No injuries reported.',
    createdAt: hoursAgo(49),
  },
]

export const seedGuards: Guard[] = [
  { id: 'G-01', name: 'Tane Whaitiri', role: 'Site Supervisor', status: 'on-duty', site: 'Westfield Riccarton', licence: 'CoA 21-087441', phone: '021 447 210', shiftEnds: '06:00' },
  { id: 'G-02', name: 'Sione Tuilagi', role: 'Senior Guard', status: 'on-duty', site: 'Commercial Bay', licence: 'CoA 21-114932', phone: '022 881 034', shiftEnds: '04:00' },
  { id: 'G-03', name: 'Priya Sharma', role: 'Guard', status: 'on-duty', site: 'ANZ Centre', licence: 'CoA 22-009318', phone: '027 555 918', shiftEnds: '06:00' },
  { id: 'G-04', name: 'Marcus Chen', role: 'Mobile Patrol', status: 'on-duty', site: 'Sylvia Park', licence: 'CoA 20-773205', phone: '021 300 662', shiftEnds: '05:00' },
  { id: 'G-05', name: 'Aroha Ngata', role: 'Guard', status: 'on-break', site: 'Britomart Precinct', licence: 'CoA 23-041177', phone: '022 190 447', shiftEnds: '02:00' },
  { id: 'G-06', name: 'Dave Kowalski', role: 'Senior Guard', status: 'off-duty', site: null, licence: 'CoA 19-556820', phone: '027 812 903', shiftEnds: null },
  { id: 'G-07', name: 'Mele Fifita', role: 'Guard', status: 'off-duty', site: null, licence: 'CoA 22-118764', phone: '021 076 385', shiftEnds: null },
  { id: 'G-08', name: 'Jordan Baker', role: 'Mobile Patrol', status: 'on-duty', site: 'CBD Night Run', licence: 'CoA 21-902241', phone: '022 664 108', shiftEnds: '07:00' },
]

export const seedSites: Site[] = [
  { id: 'S-01', name: 'Westfield Riccarton', client: 'Scentre Group', address: '129 Riccarton Rd, Christchurch', checkpoints: 24, checkpointsScanned: 22, guardsAssigned: 3, contractValue: 38500, status: 'active' },
  { id: 'S-02', name: 'Commercial Bay', client: 'Precinct Properties', address: '7 Queen St, Auckland', checkpoints: 18, checkpointsScanned: 18, guardsAssigned: 2, contractValue: 29000, status: 'active' },
  { id: 'S-03', name: 'ANZ Centre', client: 'ANZ Bank NZ', address: '23 Albert St, Auckland', checkpoints: 15, checkpointsScanned: 13, guardsAssigned: 2, contractValue: 21500, status: 'active' },
  { id: 'S-04', name: 'Sylvia Park', client: 'Kiwi Property', address: '286 Mt Wellington Hwy, Auckland', checkpoints: 30, checkpointsScanned: 26, guardsAssigned: 3, contractValue: 44000, status: 'active' },
  { id: 'S-05', name: 'Britomart Precinct', client: 'Cooper and Company', address: '12 Galway St, Auckland', checkpoints: 12, checkpointsScanned: 9, guardsAssigned: 1, contractValue: 16800, status: 'active' },
  { id: 'S-06', name: 'Wynyard Quarter', client: 'Eke Panuku', address: '2 Jellicoe St, Auckland', checkpoints: 20, checkpointsScanned: 0, guardsAssigned: 0, contractValue: 27500, status: 'onboarding' },
]

export const seedEvents: PatrolEvent[] = [
  { id: 'E-01', kind: 'checkpoint', guard: 'Tane Whaitiri', site: 'Westfield Riccarton', detail: 'Scanned checkpoint 14 — rear loading dock', minutesAgo: 4 },
  { id: 'E-02', kind: 'welfare', guard: 'Jordan Baker', site: 'CBD Night Run', detail: 'Welfare check-in confirmed', minutesAgo: 9 },
  { id: 'E-03', kind: 'checkpoint', guard: 'Priya Sharma', site: 'ANZ Centre', detail: 'Scanned checkpoint 6 — level 3 plant room', minutesAgo: 16 },
  { id: 'E-04', kind: 'incident', guard: 'Tane Whaitiri', site: 'Westfield Riccarton', detail: 'Logged INC-1042 — forced entry attempt', minutesAgo: 27 },
  { id: 'E-05', kind: 'checkpoint', guard: 'Marcus Chen', site: 'Sylvia Park', detail: 'Scanned checkpoint 21 — car park B2', minutesAgo: 33 },
  { id: 'E-06', kind: 'shift-start', guard: 'Sione Tuilagi', site: 'Commercial Bay', detail: 'Shift started — night coverage', minutesAgo: 48 },
  { id: 'E-07', kind: 'checkpoint', guard: 'Aroha Ngata', site: 'Britomart Precinct', detail: 'Scanned checkpoint 3 — east stairwell', minutesAgo: 61 },
  { id: 'E-08', kind: 'shift-end', guard: 'Dave Kowalski', site: 'Commercial Bay', detail: 'Shift ended — handover complete', minutesAgo: 74 },
]

/** Incidents logged per day, oldest first (14 days ending today). */
export const incidentTrend = [3, 5, 2, 4, 6, 3, 2, 5, 4, 7, 3, 4, 2, 6]

export function trendLabels(): string[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const out: string[] = []
  const now = new Date()
  for (let i = incidentTrend.length - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400_000)
    out.push(`${days[d.getDay()]} ${d.getDate()}`)
  }
  return out
}
