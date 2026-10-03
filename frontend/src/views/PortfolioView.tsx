import { Term } from '../components/Term'
import { Button, Card, Pill } from '../components/ui'
import { growth, money, pct, profitTone, signedMoney } from '../lib/format'
import { totals } from '../lib/portfolio'
import { useAuth } from '../store/authStore'
import { useGame } from '../store/gameStore'

export function PortfolioView() {
  const { portfolio, start, busy, health, openSheet } = useGame()
  const signedIn = !!useAuth((s) => s.userId)
  const t = totals(portfolio)
  const holdings = portfolio
    .flatMap((day, i) => day.holdings.map((h) => ({ ...h, day: i + 1 })))
    .sort((a, b) => b.stake_value - b.amount - (a.stake_value - a.amount))

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
