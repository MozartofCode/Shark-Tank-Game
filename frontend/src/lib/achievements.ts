import type { PortfolioDay } from '../types'
import type { Progress } from './progress'

export interface Achievement {
  id: string
  emoji: string
  title: string
  how: string
  earned: boolean
}

/** Consecutive daily-challenge days ending today or yesterday (UTC). */
export function dailyStreak(days: PortfolioDay[]): number {
  const dates = new Set(days.map((d) => d.daily_date).filter(Boolean) as string[])
  const dayMs = 86_400_000
  const today = Math.floor(Date.now() / dayMs)
  const key = (n: number) => new Date(n * dayMs).toISOString().slice(0, 10)
  let start = dates.has(key(today)) ? today : today - 1
  let streak = 0
  while (dates.has(key(start))) {
    streak += 1
    start -= 1
  }
  return streak
}

export function achievements(days: PortfolioDay[], progress: Progress): Achievement[] {
  const holdings = days.flatMap((d) => d.holdings)
  const multiple = (h: { amount: number; stake_value: number }) => h.stake_value / h.amount
  const streak = dailyStreak(days)
  const survivedFlop = days.some((d) => {
    const profit = d.holdings.reduce((s, h) => s + h.stake_value - h.amount, 0)
    return profit > 0 && d.holdings.some((h) => h.stake_value === 0)
  })

  return [
    { id: 'first', emoji: '🌱', title: 'First deal', how: 'Invest in a company', earned: holdings.length > 0 },
    { id: 'tenx', emoji: '🎯', title: 'Sharp eye', how: 'Get 10× your money', earned: holdings.some((h) => multiple(h) >= 10) },
    { id: 'unicorn', emoji: '🦄', title: 'Unicorn hunter', how: 'Get 100× your money', earned: holdings.some((h) => multiple(h) >= 100) },
    { id: 'diversified', emoji: '🧺', title: 'Diversified', how: 'Make 4 deals in one day', earned: days.some((d) => d.holdings.length >= 4) },
    { id: 'survivor', emoji: '🛡️', title: 'Survived a flop', how: 'Profit on a day you lost a company', earned: survivedFlop },
    { id: 'math', emoji: '🧠', title: 'Number cruncher', how: 'Answer 5 valuation checks right', earned: progress.quizRight >= 5 },
    { id: 'streak3', emoji: '🔥', title: 'On a roll', how: '3 daily challenges in a row', earned: streak >= 3 },
    { id: 'streak7', emoji: '📆', title: 'Weekly habit', how: '7 daily challenges in a row', earned: streak >= 7 },
    { id: 'ten', emoji: '🏅', title: 'Veteran', how: 'Play 10 days', earned: days.length >= 10 },
  ]
}
