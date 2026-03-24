export type BreakdownItem = {
  key: string
  label: string
  score: number
  effect: 'advance' | 'delay'
}

export type DriverItem = {
  label: string
  effect: 'advance' | 'delay'
  detail: string
}

export type CurrentData = {
  generatedAt: string
  methodologyVersion: string
  gitSha: string
  displayTime: string
  minutesToMidnight: number
  rawEstimate: number
  actualReplacementEstimate: number
  compositeScore: number
  uncertaintyMinutes: number
  summary: string
  weeklyShiftMinutes: number
  drivers: DriverItem[]
  breakdown: BreakdownItem[]
}

export type EvidenceItemData = {
  id: string
  title: string
  summary: string
  date: string
  source: string
  sourceUrl: string
  effect: 'advance' | 'delay'
  contributionType: 'slow_variable' | 'shock'
  impactLabel: string
  tags: string[]
  methodologyVersion?: string
  reviewedAt?: string
  reviewStatus?: string
}
