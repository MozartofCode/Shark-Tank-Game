import type { PortfolioDay, RevealView } from '../types'

const KEY = 'tankday.portfolio.v1'

/** Guest portfolio: kept in this browser only (signed-in players use the server). */
export function loadLocalPortfolio(): PortfolioDay[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PortfolioDay[]) : []
  } catch {
    return []
  }
}

export function saveDayLocally(reveal: RevealView): PortfolioDay[] {
  const days = loadLocalPortfolio()
  if (days.some((d) => d.game_id === reveal.game_id)) return days
  const day: PortfolioDay = {
    game_id: reveal.game_id,
    played_at: new Date().toISOString(),
    daily_date: reveal.daily_date,
    bankroll: reveal.bankroll_start,
    holdings: reveal.rounds
      .filter((r) => r.deal?.investor === 'player')
      .map((r) => ({
        pitch_id: r.pitch.id,
        company: r.pitch.company.name,
        status: r.outcome.status,
        amount: r.deal!.amount,
        equity: r.deal!.equity,
        stake_value: r.deal!.stake_value,
        reason: r.reason,
      })),
  }
  const next = [...days, day]
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage full or blocked: portfolio just won't persist */
  }
  return next
}

export interface PortfolioTotals {
  days: number
  invested: number
  value: number
  profit: number
  returnPct: number
  winners: number
  losers: number
}

export function totals(days: PortfolioDay[]): PortfolioTotals {
  const holdings = days.flatMap((d) => d.holdings)
  const invested = holdings.reduce((s, h) => s + h.amount, 0)
  const value = holdings.reduce((s, h) => s + h.stake_value, 0)
  return {
    days: days.length,
    invested,
    value,
    profit: value - invested,
    returnPct: invested ? ((value - invested) / invested) * 100 : 0,
    winners: holdings.filter((h) => h.stake_value > h.amount).length,
    losers: holdings.filter((h) => h.stake_value < h.amount).length,
  }
}
