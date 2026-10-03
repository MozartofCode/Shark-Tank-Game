import { Button, Card, Eyebrow } from '../components/ui'
import { money, pct, profitTone, signedMoney, signedPct } from '../lib/format'
import { totals } from '../lib/portfolio'
import { STATUS_STYLE } from '../lib/status'
import { useAuth } from '../store/authStore'
import { useGame } from '../store/gameStore'

export function PortfolioView() {
  const { portfolio, start, busy, health } = useGame()
  const signedIn = !!useAuth((s) => s.userId)
  const t = totals(portfolio)
  const holdings = portfolio
    .flatMap((day, i) => day.holdings.map((h) => ({ ...h, day: i + 1 })))
    .sort((a, b) => b.stake_value - b.amount - (a.stake_value - a.amount))
  const best = holdings[0]
  const bestProfit = best ? best.stake_value - best.amount : 0

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="text-center">
        <Eyebrow>All your days, added up</Eyebrow>
        <h2 className="mt-2 font-display text-4xl tracking-tight">My portfolio</h2>
      </div>

      {t.days === 0 ? (
        <Card className="mt-8 text-center">
          <p>No days played yet. Finish a day and every company you invest in will show up here.</p>
          <Button onClick={() => start('random')} disabled={busy} className="mt-4">
            ▶ Play
          </Button>
        </Card>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Days played" value={String(t.days)} />
            <Stat label="Total invested" value={money(t.invested, { compact: true })} />
            <Stat label="Worth now" value={money(t.value, { compact: true })} />
            <Stat
              label="Total profit"
              value={signedMoney(t.profit, true)}
              tone={profitTone(t.profit)}
              sub={t.invested ? signedPct(t.returnPct) : undefined}
            />
          </div>

          <Card className="mt-6">
            <p className="text-sm text-[#c3cde0]">
              You've backed <strong>{holdings.length}</strong> compan{holdings.length === 1 ? 'y' : 'ies'}:{' '}
              <span className="text-win">{t.winners} made money</span>,{' '}
              <span className="text-loss">{t.losers} lost money</span>.
              {best && bestProfit > 0 && t.losers > 0 && (
                <>
                  {' '}
                  Notice how one big winner ({best.company}, {signedMoney(bestProfit, true)}) can make up for many
                  losers? That's how real startup investors think: spread your bets.
                </>
              )}
            </p>
          </Card>

          <Card className="mt-6">
            <p className="font-semibold">Your companies</p>
            {holdings.length === 0 ? (
              <p className="mt-3 text-sm text-muted">You haven't invested in any company yet. Being careful is fine!</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {holdings.map((h, i) => {
                  const profit = h.stake_value - h.amount
                  const s = STATUS_STYLE[h.status]
                  return (
                    <li key={`${h.pitch_id}-${h.day}-${i}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                      <div className="min-w-40 flex-1">
                        <p className="font-semibold">{h.company}</p>
                        <p className="text-xs text-muted">
                          Day {h.day} · {pct(h.equity)} of the company
                          {s && <span className={`ml-2 rounded px-1.5 py-0.5 ${s.cls}`}>{s.label}</span>}
                        </p>
                      </div>
                      <p className="text-sm tabular-nums">
                        {money(h.amount, { compact: true })} → {money(h.stake_value, { compact: true })}
                      </p>
                      <p className={`w-24 text-right font-semibold tabular-nums ${profitTone(profit)}`}>
                        {signedMoney(profit, true)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </>
      )}

      {health?.accounts && !signedIn && t.days > 0 && (
        <p className="mt-4 text-center text-xs text-muted">
          This portfolio is saved on this device only. Sign in on the home screen to keep it everywhere.
        </p>
      )}

      <div className="mt-8 text-center">
        <Button onClick={() => start('random')} disabled={busy} className="px-10 py-3 text-base">
          ▶ Play another day
        </Button>
      </div>
    </main>
  )
}

function Stat({ label, value, tone = '', sub }: { label: string; value: string; tone?: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${tone}`}>{value}</p>
      {sub && <p className={`text-xs ${tone}`}>{sub}</p>}
    </Card>
  )
}
