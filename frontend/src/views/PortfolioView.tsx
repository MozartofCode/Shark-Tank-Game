import { Button, Card, Pill } from '../components/ui'
import { growth, money, pct, profitTone, signedMoney } from '../lib/format'
import { totals } from '../lib/portfolio'
import { STATUS, UNKNOWN_STATUS } from '../lib/status'
import { useAuth } from '../store/authStore'
import { useGame } from '../store/gameStore'

export function PortfolioView() {
  const { portfolio, start, busy, health, openSheet } = useGame()
  const signedIn = !!useAuth((s) => s.userId)
  const t = totals(portfolio)
  const holdings = portfolio
    .flatMap((day, i) => day.holdings.map((h) => ({ ...h, day: i + 1 })))
    .sort((a, b) => b.stake_value - b.amount - (a.stake_value - a.amount))
  const best = holdings[0]
  const bestProfit = best ? best.stake_value - best.amount : 0

  return (
    <main className="mx-auto max-w-2xl px-5 pt-12 pb-6">
      <p className="text-[13px] font-medium text-muted">
        Portfolio · {t.days} day{t.days === 1 ? '' : 's'} played
      </p>
      <h1 className={`mt-1 text-[56px] leading-none font-bold tabular-nums ${profitTone(t.profit)}`}>
        {signedMoney(t.profit, true)}
      </h1>
      <p className="mt-3 text-[17px] text-muted">
        {t.days === 0
          ? 'Finish a day and every company you invest in shows up here.'
          : `You put in ${money(t.invested, { compact: true })}. It’s worth ${money(t.value, { compact: true })} today${
              t.invested ? ` (${growth(t.invested, t.value)})` : ''
            }.`}
      </p>

      {t.days === 0 ? (
        <Button size="lg" onClick={() => start('random')} disabled={busy} className="mt-8">
          Play your first day
        </Button>
      ) : (
        <>
          {holdings.length > 0 && t.losers > 0 && bestProfit > 0 && (
            <Card className="mt-8 bg-accent/8 shadow-none">
              <p className="text-[15px] leading-relaxed">
                <span className="font-semibold">{t.winners} made money, {t.losers} didn’t.</span>{' '}
                <span className="text-muted">
                  Your best pick, {best.company}, earned {signedMoney(bestProfit, true)}, enough to cover a lot of
                  misses. That’s why investors spread their bets.
                </span>
              </p>
            </Card>
          )}

          <Card className="mt-6 px-0 py-2">
            {holdings.length === 0 ? (
              <p className="px-6 py-4 text-[15px] text-muted">
                You haven’t bought into any company yet. Being picky is allowed!
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {holdings.map((h, i) => {
                  const profit = h.stake_value - h.amount
                  const s = STATUS[h.status] ?? UNKNOWN_STATUS
                  return (
                    <li key={`${h.pitch_id}-${h.day}-${i}`} className="flex items-center gap-4 px-6 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[17px] font-semibold">{h.company}</p>
                        <p className="mt-0.5 text-[13px] text-muted">
                          Day {h.day} · {pct(h.equity)} · {money(h.amount, { compact: true })} in
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[17px] font-semibold tabular-nums">{money(h.stake_value, { compact: true })}</p>
                        <Pill tone={profit > 0 ? 'win' : profit < 0 ? 'loss' : 'neutral'} className="mt-1 tabular-nums">
                          {signedMoney(profit, true)}
                        </Pill>
                      </div>
                      <span className="sr-only">{s.label}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {health?.accounts && !signedIn && (
            <p className="mt-5 text-center text-[13px] text-muted">
              Saved on this device only.{' '}
              <button onClick={() => openSheet('account')} className="text-accent hover:underline">
                Sign in
              </button>{' '}
              to keep it everywhere.
            </p>
          )}

          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={() => start('random')} disabled={busy} className="min-w-52">
              Play another day
            </Button>
          </div>
        </>
      )}
    </main>
  )
}
