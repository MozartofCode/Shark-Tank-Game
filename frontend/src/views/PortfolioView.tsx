import { Term } from '../components/Term'
import { Button, Card, Pill } from '../components/ui'
import { growth, money, pct, profitTone, signedMoney } from '../lib/format'
import { achievements, dailyStreak } from '../lib/achievements'
import { totals } from '../lib/portfolio'
import { loadProgress } from '../lib/progress'
import { REASON_LABEL, type Reason } from '../lib/reasons'
import { useAuth } from '../store/authStore'
import { useGame } from '../store/gameStore'

export function PortfolioView() {
  const { portfolio, start, busy, health, openSheet } = useGame()
  const signedIn = !!useAuth((s) => s.userId)
  const t = totals(portfolio)
  const holdings = portfolio
    .flatMap((day, i) => day.holdings.map((h) => ({ ...h, day: i + 1 })))
    .sort((a, b) => b.stake_value - b.amount - (a.stake_value - a.amount))

  const badges = achievements(portfolio, loadProgress())
  const streak = dailyStreak(portfolio)
  const byReason = new Map<Reason, { profit: number; count: number }>()
  for (const h of holdings) {
    if (!h.reason) continue
    const cur = byReason.get(h.reason) ?? { profit: 0, count: 0 }
    byReason.set(h.reason, { profit: cur.profit + h.stake_value - h.amount, count: cur.count + 1 })
  }

  if (t.days === 0) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center px-5 pt-24 pb-6 text-center">
        <p className="text-5xl" aria-hidden>
          📈
        </p>
        <h1 className="mt-4 text-[28px] font-bold">No investments yet</h1>
        <Button size="lg" onClick={() => start('random')} disabled={busy} className="mt-8">
          Play
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pt-12 pb-6">
      <p className="text-[13px] font-medium text-muted">
        Portfolio · {t.days} day{t.days === 1 ? '' : 's'}
        {streak >= 2 && <span className="text-warn"> · 🔥 {streak}-day streak</span>}
      </p>
      <h1 className={`mt-1 text-[56px] leading-none font-bold tabular-nums ${profitTone(t.profit)}`}>
        {signedMoney(t.profit, true)}
      </h1>
      {t.invested > 0 && (
        <p className="mt-3 text-[17px] text-muted">
          {money(t.invested, { compact: true })} → {money(t.value, { compact: true })} ·{' '}
          {growth(t.invested, t.value)}
        </p>
      )}

      {t.winners > 0 && t.losers > 0 && (
        <p className="mt-6 text-[15px] text-muted">
          <span className="font-medium text-win">{t.winners} up</span>,{' '}
          <span className="font-medium text-loss">{t.losers} down</span>. That’s why investors{' '}
          <Term id="diversify">diversify</Term>.
        </p>
      )}

      {byReason.size > 0 && (
        <Card className="mt-6">
          <p className="text-[15px] font-semibold">What works for you</p>
          <ul className="mt-3 space-y-2">
            {[...byReason.entries()]
              .sort((a, b) => b[1].profit - a[1].profit)
              .map(([reason, v]) => (
                <li key={reason} className="flex items-center justify-between text-[15px]">
                  <span>
                    {REASON_LABEL[reason]} <span className="text-faint">· {v.count}</span>
                  </span>
                  <span className={`font-semibold tabular-nums ${profitTone(v.profit)}`}>
                    {signedMoney(v.profit, true)}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      )}

      <Card className="mt-6 px-0 py-2">
        {holdings.length === 0 ? (
          <p className="px-6 py-4 text-[15px] text-muted">You passed on everything so far.</p>
        ) : (
          <ul className="divide-y divide-line">
            {holdings.map((h, i) => {
              const profit = h.stake_value - h.amount
              return (
                <li key={`${h.pitch_id}-${h.day}-${i}`} className="flex items-center gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px] font-semibold">{h.company}</p>
                    <p className="mt-0.5 text-[13px] text-muted">
                      Day {h.day} · {pct(h.equity)} · {money(h.amount, { compact: true })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[17px] font-semibold tabular-nums">{money(h.stake_value, { compact: true })}</p>
                    <Pill tone={profit > 0 ? 'win' : profit < 0 ? 'loss' : 'neutral'} className="mt-1 tabular-nums">
                      {signedMoney(profit, true)}
                    </Pill>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <section className="mt-8">
        <p className="px-1 text-[13px] font-semibold tracking-wide text-muted uppercase">
          Achievements · {badges.filter((b) => b.earned).length}/{badges.length}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              title={b.how}
              className={`flex flex-col items-center rounded-2xl bg-surface p-4 text-center shadow-[var(--shadow-card)] ${
                b.earned ? '' : 'opacity-40 grayscale'
              }`}
            >
              <span className="text-3xl" aria-hidden>
                {b.emoji}
              </span>
              <span className="mt-2 text-[13px] font-semibold">{b.title}</span>
              <span className="mt-0.5 text-[11px] leading-tight text-muted">{b.how}</span>
              <span className="sr-only">{b.earned ? 'Earned' : 'Not earned yet'}</span>
            </div>
          ))}
        </div>
      </section>

      {health?.accounts && !signedIn && (
        <p className="mt-5 text-center">
          <Button variant="plain" onClick={() => openSheet('account')}>
            Sign in to save
          </Button>
        </p>
      )}

      <div className="mt-8 flex justify-center">
        <Button size="lg" onClick={() => start('random')} disabled={busy} className="min-w-48">
          Play again
        </Button>
      </div>
    </main>
  )
}
