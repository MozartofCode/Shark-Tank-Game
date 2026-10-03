import { useEffect, useState } from 'react'
import { AccountPanel } from '../components/AccountPanel'
import { Button, Card, Eyebrow } from '../components/ui'
import { money, pct, profitTone, signedMoney } from '../lib/format'
import { totals } from '../lib/portfolio'
import { STATUS_STYLE } from '../lib/status'
import { useGame } from '../store/gameStore'
import type { RevealRound, RevealView as Reveal, SharkPersona } from '../types'

export function RevealView() {
  const { reveal, sharks } = useGame()
  const [shown, setShown] = useState(1)
  if (!reveal) return null
  const done = shown >= reveal.rounds.length

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="animate-rise text-center">
        <Eyebrow>Fast-forward</Eyebrow>
        <h2 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Years later…</h2>
        <p className="mt-3 text-[#c3cde0]">Here's what really happened to each company.</p>
      </div>

      <div className="mt-8 space-y-5">
        {reveal.rounds.slice(0, shown).map((r) => (
          <RevealCard key={r.index} r={r} sharks={sharks} />
        ))}
      </div>

      {!done ? (
        <div className="mt-8 text-center">
          <Button onClick={() => setShown((n) => n + 1)} className="px-8 py-3 text-base">
            Next: {reveal.rounds[shown].pitch.company.name} →
          </Button>
          <p className="mt-2 text-xs text-muted">
            {shown} of {reveal.rounds.length} revealed
          </p>
        </div>
      ) : (
        <Summary reveal={reveal} />
      )}
    </main>
  )
}

function RevealCard({ r, sharks }: { r: RevealRound; sharks: SharkPersona[] }) {
  const s = STATUS_STYLE[r.outcome.status]
  const mine = r.deal?.investor === 'player'
  const sharkName = sharks.find((x) => x.id === r.deal?.investor)?.name
  const grew = r.deal ? r.deal.stake_value >= r.deal.amount : false

  return (
    <Card className={`animate-flip ${mine ? (grew ? 'border-win/60' : 'border-loss/60') : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-bold">{r.pitch.company.name}</h3>
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
      </div>
      <p className="mt-1 text-[#e6ecf7]">{r.outcome.headline}</p>

      {r.deal && (
        <div className={`mt-4 rounded-xl p-4 ${grew ? 'bg-win/10' : 'bg-loss/10'}`}>
          <p className="text-sm text-muted">{mine ? 'Your investment' : `${sharkName}'s investment`}</p>
          <p className="mt-1 text-lg">
            {money(r.deal.amount)} →{' '}
            <CountUp value={r.deal.stake_value} className={`font-bold ${grew ? 'text-win' : 'text-loss'}`} />
          </p>
          <p className="text-sm text-[#c3cde0]">
            {r.deal.stake_value === 0
              ? 'All of the money was lost.'
              : `${r.deal.moic}× the money (${pct(r.deal.equity)} of the company)`}
          </p>
        </div>
      )}
      {!r.deal && <p className="mt-3 text-sm text-muted">Nobody invested in this one today.</p>}

      <p className="mt-4 text-sm leading-relaxed text-[#c3cde0]">{r.outcome.story}</p>
      <p className="mt-2 text-sm text-muted">
        <span className="font-semibold">On the real show:</span> {r.real_deal.summary}
      </p>

      {r.lessons[0] && (
        <div className="mt-4 rounded-xl border border-sea/30 bg-sea/5 p-3 text-sm">
          <p className="font-semibold text-sea">💡 {r.lessons[0].title}</p>
          <p className="mt-1 text-[#cdd6e8]">{r.lessons[0].body}</p>
        </div>
      )}

      <p className="mt-3 text-xs text-muted">
        {r.outcome.years_later} year{r.outcome.years_later > 1 ? 's' : ''} later · company worth{' '}
        {r.outcome.value_basis === 'estimate' ? 'about ' : ''}
        {money(r.outcome.exit_value, { compact: true })}
        {r.outcome.value_basis === 'estimate' ? ' (estimate)' : ''}
        {r.outcome.retention_factor < 1 && r.outcome.exit_value > 0
          ? ` · early investors' slices shrank as the company raised more money`
          : ''}{' '}
        · Sources:{' '}
        {r.outcome.sources.map((src, i) => (
          <a key={src} href={src} target="_blank" rel="noreferrer" className="underline hover:text-[#e6ecf7]">
            [{i + 1}]
          </a>
        ))}
      </p>
    </Card>
  )
}

function Summary({ reveal }: { reveal: Reveal }) {
  const { start, busy, health, portfolio, openPortfolio } = useGame()
  const up = reveal.profit >= 0
  const life = totals(portfolio)
  const rank = reveal.standings.findIndex((s) => s.investor === 'player') + 1

  return (
    <section className="animate-rise mt-12 space-y-6">
      <Card className="p-8 text-center">
        <Eyebrow>Today's result</Eyebrow>
        <p className={`mt-2 font-display text-5xl ${profitTone(reveal.profit)}`}>
          {reveal.invested === 0 ? '$0' : signedMoney(reveal.profit)}
        </p>
        <p className="mt-2 text-[#c3cde0]">
          {reveal.invested === 0
            ? "You didn't invest today. No risk, but no reward either."
            : up
              ? 'Your investments made money!'
              : 'Your investments lost money this time.'}
        </p>
        <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
          <Mini label="You invested" value={money(reveal.invested)} />
          <Mini label="Now worth" value={money(reveal.portfolio_value)} />
          <Mini label="Cash you didn't use" value={money(reveal.cash_left)} />
        </div>
        <p className="mt-6 text-sm text-[#c3cde0]">
          📊 For comparison: {money(reveal.bankroll_start, { compact: true })} in an index fund (a mix of hundreds of
          big companies) for {reveal.benchmark_years} years would grow to about{' '}
          <strong>{money(reveal.benchmark_value, { compact: true })}</strong>. Index funds are the "slow and steady"
          way to invest.
        </p>
      </Card>

      <Card>
        <p className="font-semibold">
          {rank === 1 ? '🏆 You beat every shark today!' : `You finished #${rank} of ${reveal.standings.length}`}
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-2 pr-3">Investor</th>
                <th className="py-2 pr-3 text-right">Invested</th>
                <th className="py-2 pr-3 text-right">Now worth</th>
                <th className="py-2 text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {reveal.standings.map((s) => (
                <tr key={s.investor} className={`border-t border-line ${s.investor === 'player' ? 'text-gold' : ''}`}>
                  <td className="py-2 pr-3 font-semibold">{s.name}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{money(s.invested, { compact: true })}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{money(s.portfolio_value, { compact: true })}</td>
                  <td className={`py-2 text-right tabular-nums ${profitTone(s.profit)}`}>
                    {signedMoney(s.profit, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="text-center">
        <p className="font-semibold">📈 Your portfolio</p>
        <p className="mt-1 text-sm text-[#c3cde0]">
          {life.days} day{life.days === 1 ? '' : 's'} played · {money(life.invested, { compact: true })} invested ·
          now worth {money(life.value, { compact: true })}
        </p>
        <p className={`mt-2 text-2xl font-bold ${profitTone(life.profit)}`}>
          {signedMoney(life.profit, true)} total
        </p>
        <Button variant="ghost" onClick={openPortfolio} className="mt-4">
          Open my portfolio
        </Button>
        {health?.accounts &&
          (reveal.saved ? (
            <p className="mt-4 text-sm text-win">✓ Saved to your account.</p>
          ) : (
            <div className="mt-5 border-t border-line pt-5">
              <p className="mb-3 text-sm text-muted">Sign in to save your portfolio and join the leaderboard.</p>
              <AccountPanel />
            </div>
          ))}
      </Card>

      <div className="text-center">
        <Button onClick={() => start('random')} disabled={busy} className="px-10 py-3 text-base">
          ▶ Play another day
        </Button>
      </div>
    </section>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-stage/70 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function CountUp({ value, className }: { value: number; className?: string }) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [n, setN] = useState(reduce ? value : 0)
  useEffect(() => {
    if (reduce) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1200)
      setN(Math.round(value * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduce])
  return <span className={className}>{money(reduce ? value : n)}</span>
}
