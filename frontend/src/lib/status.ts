/** Plain-language labels for what happened to a company. */
export const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  thriving: { label: 'Still growing', cls: 'bg-win/15 text-win' },
  acquired: { label: 'Bought by a bigger company', cls: 'bg-sea/15 text-sea' },
  failed: { label: 'Went out of business', cls: 'bg-loss/15 text-loss' },
}
