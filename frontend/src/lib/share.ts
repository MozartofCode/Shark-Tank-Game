import type { RevealView } from '../types'
import { money } from './format'

const LAUNCH = Date.UTC(2026, 9, 1) // first daily challenge: Oct 1, 2026

/** "Tank Day #3 ☀️ 🟩🟥⬜🟥🟩 +$2.4M" style text for sharing a day. */
export function shareText(reveal: RevealView): string {
  const squares = reveal.rounds
    .map((r) => {
      if (r.deal?.investor !== 'player') return '⬜'
      return r.deal.stake_value > r.deal.amount ? '🟩' : '🟥'
    })
    .join('')
  const title = reveal.daily_date
    ? `Tank Day #${Math.floor((Date.parse(reveal.daily_date) - LAUNCH) / 86_400_000) + 1} ☀️`
    : 'Tank Day'
  const result =
    reveal.invested === 0
      ? 'Sat out'
      : `${reveal.profit >= 0 ? '+' : '-'}${money(Math.abs(reveal.profit), { compact: true })}`
  return `${title}\n${squares} ${result}\n${window.location.origin}`
}

/** Native share sheet when available, otherwise copy to the clipboard. */
export async function share(text: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) {
      await navigator.share({ text })
      return 'shared'
    }
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
