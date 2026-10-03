import { useEffect, useState } from 'react'
import { Button, Card, Eyebrow } from '../components/ui'
import { money, pct, signedPct } from '../lib/format'
import { useGame } from '../store/gameStore'
import type { RevealRound, RevealView as Reveal, SharkPersona } from '../types'

const STATUS_STYLE = {
  thriving: { label: 'Thriving', cls: 'bg-win/15 text-win' },
  acquired: { label: 'Acquired', cls: 'bg-sea/15 text-sea' },
  failed: { label: 'Failed', cls: 'bg-loss/15 text-loss' },
} as const

export function RevealView() {
  const { reveal, sharks, start, busy } = useGame()
  const [shown, setShown] = useState(0)
  if (!reveal) return null
  const done = shown >= reveal.rounds.length

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="animate-rise text-center">
        <Eyebrow>Fast-forward</Eyebrow>
        <h2 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Years later…</h2>
        <p className="mt-3 text-muted">Here's what really happened to every company you saw today.</p>
      </div>

      <div className="mt-10 space-y-5">
        {reveal.rounds.slice(0, shown).map((r) => (
          <RevealCard key={r.index} r={r} sharks={sharks} />
        ))}
      </div>

      {!done ? (
        <div className="mt-8 text-center">
          <Button onClick={() => setShown((n) => n + 1)} className="px-8 py-3 text-base">
            {shown === 0 ? 'Reveal the first company' : `Reveal ${reveal.rounds[shown].pitch.company.name}`} →
          </Button>
        </div>
      ) : (
        <Summary reveal={reveal} onReplay={start} busy={busy} />
      )}
    </main>
  )
}

function RevealCard({ r, sharks }: { r: RevealRound; sharks: SharkPersona[] }) {
  const s = STATUS_STYLE[r.outcome.status]
  const mine = r.deal?.investor === 'player'
  const investor = mine ? 'You' : sharks.find((x) => x.id === r.deal?.investor)?.name
  return (
    <Card className={`animate-flip ${mine ? 'border-gold/60' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{r.pitch.company.name}</h3>
            <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
          </div>
          <p className="mt-1 text-sm text-[#c3cde0]">{r.outcome.headline}</p>
        </div>
        {r.deal && (
          <div className="text-right">
            <p className="text-xs text-muted">{mine ? 'Your' : `${investor}'s`} stake today</p>
            <CountUp
              value={r.deal.stake_value}
              className={`text-2xl font-bold tabular-nums ${r.deal.moic >= 1 ? 'text-win' : 'text-loss'}`}
            />
            <p className="text-xs text-muted">
              {money(r.deal.amount, { compact: true })} for {pct(r.deal.equity)} · {r.deal.moic}× money
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#c3cde0]">{r.outcome.story}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-stage/70 p-3 text-sm">
          <p className="text-xs font-semibold text-muted uppercase">Today in the tank</p>
          <p className="mt-1">
            {r.deal
              ? `${investor} won the deal.`
              : 'Nobody got a deal.'}
          </p>
          <p className="mt-2 text-xs font-semibold text-muted uppercase">On the real show</p>
          <p className="mt-1">{r.real_deal.summary}</p>
        </div>
        {r.lessons[0] && (
          <div className="rounded-xl border border-sea/30 bg-sea/5 p-3 text-sm">
            <p className="text-xs font-semibold text-sea uppercase">Lesson · {r.lessons[0].title}</p>
            <p className="mt-1 text-[#cdd6e8]">{r.lessons[0].body}</p>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-muted">
        {r.outcome.years_later} yr{r.outcome.years_later > 1 ? 's' : ''} later · company value{' '}
        {r.outcome.value_basis === 'estimate' ? '(estimated) ' : ''}
        {money(r.outcome.exit_value, { compact: true })}
        {r.outcome.retention_factor < 1 && r.outcome.exit_value > 0
          ? ` · early stake keeps ${pct(r.outcome.retention_factor, 0)} after dilution`
          : ''}{' '}
        · as of {r.outcome.as_of} · Sources:{' '}
        {r.outcome.sources.map((src, i) => (
          <a key={src} href={src} target="_blank" rel="noreferrer" className="underline hover:text-[#e6ecf7]">
            [{i + 1}]
          </a>
        ))}
      </p>
    </Card>
  )
}

function Summary({ reveal, onReplay, busy }: { reveal: Reveal; onReplay: () => void; busy: boolean }) {
  const up = reveal.net_worth >= reveal.bankroll_start
  const beatIndex = reveal.net_worth >= reveal.benchmark_value
  const rank = reveal.standings.findIndex((s) => s.investor === 'player') + 1
  return (
    <section className="animate-rise mt-12">
      <Card className="p-8 text-center">
        <Eyebrow>Final net worth</Eyebrow>
        <CountUp value={reveal.net_worth} className={`mt-2 block font-display text-5xl ${up ? 'text-win' : 'text-loss'}`} />
        <p className="mt-2 text-lg">
          {signedPct(reveal.return_pct)} on your {money(reveal.bankroll_start, { compact: true })}
        </p>
        <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
          <Mini label="Invested" value={money(reveal.invested)} />
          <Mini label="Portfolio value" value={money(reveal.portfolio_value)} />
          <Mini label="Cash never deployed" value={money(reveal.cash_left)} />
        </div>
        <p className="mt-6 text-sm text-[#c3cde0]">
          If you'd put the whole {money(reveal.bankroll_start, { compact: true })} in an index fund for{' '}
          {reveal.benchmark_years} years (~10%/yr), you'd have{' '}
          <strong>{money(reveal.benchmark_value, { compact: true })}</strong>.{' '}
          {beatIndex ? 'You beat the market. Nice picking!' : 'The boring index fund won this time.'}
        </p>
        {(reveal.best_deal || reveal.worst_deal) && (
          <p className="mt-2 text-sm text-muted">
            {reveal.best_deal && <>Best pick: <strong className="text-win">{reveal.best_deal}</strong>. </>}
            {reveal.worst_deal && <>Worst pick: <strong className="text-loss">{reveal.worst_deal}</strong>.</>}
          </p>
        )}
      </Card>

      <Card className="mt-6">
        <p className="font-semibold">
          Leaderboard: you finished #{rank} of {reveal.standings.length}
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-2 pr-3">Investor</th>
                <th className="py-2 pr-3">Deals</th>
                <th className="py-2 pr-3 text-right">Invested</th>
                <th className="py-2 pr-3 text-right">Worth now</th>
                <th className="py-2 text-right">Return</th>
              </tr>
            </thead>
            <tbody>
              {reveal.standings.map((s) => (
                <tr key={s.investor} className={`border-t border-line ${s.investor === 'player' ? 'text-gold' : ''}`}>
                  <td className="py-2 pr-3 font-semibold">{s.name}</td>
                  <td className="py-2 pr-3">{s.deals}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{money(s.invested, { compact: true })}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{money(s.portfolio_value, { compact: true })}</td>
                  <td className={`py-2 text-right tabular-nums ${s.return_pct >= 0 ? 'text-win' : 'text-loss'}`}>
                    {signedPct(s.return_pct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-8 text-center">
        <Button onClick={onReplay} disabled={busy} className="px-8 py-3 text-base">
          Play another day
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
