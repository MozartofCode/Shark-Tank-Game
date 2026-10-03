/** Plain-language labels for what happened to a company. */
export const STATUS: Record<string, { label: string; tone: 'win' | 'loss' | 'accent' | 'neutral' }> = {
  thriving: { label: 'Still growing', tone: 'win' },
  acquired: { label: 'Bought by a bigger company', tone: 'accent' },
  failed: { label: 'Went out of business', tone: 'loss' },
}

export const UNKNOWN_STATUS = { label: 'Unknown', tone: 'neutral' as const }
