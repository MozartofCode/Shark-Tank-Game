import { useEffect, useState } from 'react'
import { Term } from '../components/Term'
import { Avatar, Button, Card, Pill } from '../components/ui'
import { money, profitTone, signedMoney } from '../lib/format'
import { totals } from '../lib/portfolio'
import { REASON_LABEL } from '../lib/reasons'
import { share, shareText } from '../lib/share'
import { STATUS, UNKNOWN_STATUS } from '../lib/status'
import { useGame } from '../store/gameStore'
import type { RevealRound, RevealView as Reveal, SharkPersona } from '../types'

export function RevealView() {
  const { reveal, sharks } = useGame()
  const [index, setIndex] = useState(0)
  if (!reveal) return null
  const total = reveal.rounds.length
  const onSummary = index >= total

  const go = (i: number) => {
    setIndex(i)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pt-10 pb-6">
      <div className="text-center">
        <p className="text-[13px] font-medium text-muted">{onSummary ? 'Your day' : 'Years later…'}</p>
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {[...reveal.rounds.map((r) => r.index), total].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? 'w-6 bg-fg' : i < index ? 'w-1.5 bg-fg/50' : 'w-1.5 bg-fg/15'
              }`}
            />
          ))}
        </div>
      </div>

      <div key={index} className="animate-scale-in mt-8">
        {onSummary ? (
          <Summary reveal={reveal} sharks={sharks} />
        ) : (
          <>
            <RevealCard r={reveal.rounds[index]} sharks={sharks} />
            <div className="mt-6 flex justify-center gap-3">
              {index > 0 && (
                <Button size="lg" variant="secondary" onClick={() => go(index - 1)}>
                  Back
                </Button>
              )}
              <Button size="lg" onClick={() => go(index + 1)} className="min-w-40">
                {index + 1 < total ? 'Next' : 'See your day'}
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function RevealCard({ r, sharks }: { r: RevealRound; sharks: SharkPersona[] }) {
  const status = STATUS[r.outcome.status] ?? UNKNOWN_STATUS
  const mine = r.deal?.investor === 'player'
  const who = mine ? 'You' : sharks.find((x) => x.id === r.deal?.investor)?.name.split(' ')[0]
  const profit = r.deal ? r.deal.stake_value - r.deal.amount : 0

  return (
    <Card className="p-7 sm:p-9">
      <Pill tone={status.tone}>{status.label}</Pill>
      <h2 className="mt-4 text-[32px] leading-tight font-bold">{r.pitch.company.name}</h2>
      <p className="mt-2 text-[17px] leading-relaxed text-muted">{r.outcome.headline}</p>

      <div className={`mt-6 rounded-2xl px-5 py-5 ${r.deal ? (profit >= 0 ? 'bg-win/10' : 'bg-loss/10') : 'bg-fill'}`}>
        {r.deal ? (
          <>
            <p className="text-[13px] font-medium text-muted">
              {who}
              {mine && r.reason && <span className="text-faint"> · invested for: {REASON_LABEL[r.reason]}</span>}
            </p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-[34px] font-bold tabular-nums">
              <span className="text-faint">{money(r.deal.amount, { compact: true })}</span>
              <span className="text-[22px] text-faint" aria-hidden>
                →
              </span>
              <CountUp value={r.deal.stake_value} className={profitTone(profit)} />
              {r.deal.stake_value > 0 && (
                <span className="text-[17px] font-semibold text-muted">
                  <Term id="multiple">{r.deal.moic}×</Term>
                </span>
              )}
            </p>
            {r.deal.royalty_payout > 0 && (
              <p className="mt-1 text-[13px] text-muted">
                incl. {money(r.deal.royalty_payout, { compact: true })} paid back by the{' '}
                <Term id="royalty">royalty</Term>
              </p>
            )}
          </>
        ) : (
          <p className="text-[15px] text-muted">No one invested.</p>
        )}
      </div>

      {r.lessons[0] && (
        <div className="mt-5 rounded-2xl bg-accent/8 px-5 py-4">
          <p className="text-[15px] font-semibold text-accent">💡 {r.lessons[0].title}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">{r.lessons[0].body}</p>
        </div>
      )}

      <details className="group mt-5">
        <summary className="cursor-pointer list-none text-[15px] font-medium text-accent [&::-webkit-details-marker]:hidden">
          What happened <span className="inline-block transition group-open:rotate-90">›</span>
        </summary>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">
          <p className="text-fg">{r.outcome.story}</p>
          <p>
            <span className="font-medium text-fg">On the show: </span>
            {r.real_deal.summary}
          </p>
          <p className="text-xs text-faint">
            {r.outcome.years_later} yr{r.outcome.years_later > 1 ? 's' : ''} later · worth{' '}
            {r.outcome.value_basis === 'estimate' ? '~' : ''}
            {money(r.outcome.exit_value, { compact: true })}
            {r.outcome.retention_factor < 1 && r.outcome.exit_value > 0 && (
              <>
                {' '}
                · after <Term id="dilution">dilution</Term>
              </>
            )}{' '}
            ·{' '}
            {r.outcome.sources.map((src, i) => (
              <a key={src} href={src} target="_blank" rel="noreferrer" className="hover:text-muted hover:underline">
                [{i + 1}]
              </a>
            ))}
          </p>
        </div>
      </details>
    </Card>
  )
}

function Summary({ reveal, sharks }: { reveal: Reveal; sharks: SharkPersona[] }) {
  const { start, busy, health, portfolio, openPortfolio, openSheet, game } = useGame()
  const life = totals(portfolio)
  const rank = reveal.standings.findIndex((s) => s.investor === 'player') + 1
  const sat = reveal.invested === 0
  const [shared, setShared] = useState<string | null>(null)

  return (
    <div className="space-y-5">
      <Card className="p-8 text-center sm:p-10">
        <p className="text-[15px] text-muted">{sat ? 'You sat out' : reveal.profit >= 0 ? 'You made' : 'You lost'}</p>
        <p className={`mt-1 text-[64px] leading-none font-bold tabular-nums ${profitTone(reveal.profit)}`}>
          {money(Math.abs(reveal.profit), { compact: true })}
        </p>
        {!sat && (
          <p className="mt-4 text-[15px] text-muted">
            {money(reveal.invested, { compact: true })} → {money(reveal.portfolio_value, { compact: true })}
          </p>
        )}
        <p className="mt-6 text-[13px] text-faint">
          <Term id="index-fund">Index fund</Term> instead: {money(reveal.bankroll_start, { compact: true })} →{' '}
          {money(reveal.benchmark_value, { compact: true })} in {Math.round(reveal.benchmark_years)} yrs
        </p>
      </Card>

      <Card>
        <p className="text-[17px] font-semibold">{rank === 1 ? 'You beat every shark 🏆' : `#${rank} of ${reveal.standings.length}`}</p>
        <ul className="mt-3 divide-y divide-line">
          {reveal.standings.map((s) => {
            const shark = sharks.find((x) => x.id === s.investor)
            return (
              <li key={s.investor} className="flex items-center gap-3 py-3">
                <Avatar emoji={shark?.avatar ?? '🙂'} color={shark?.color ?? '#0071e3'} size={32} />
                <span className={`flex-1 text-[15px] ${s.investor === 'player' ? 'font-semibold' : ''}`}>
                  {shark ? s.name.split(' ')[0] : s.name}
                </span>
                <span className={`text-right text-[15px] font-semibold tabular-nums ${profitTone(s.profit)}`}>
                  {signedMoney(s.profit, true)}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>

      <button
        onClick={openPortfolio}
        className="flex w-full items-center justify-between rounded-3xl bg-surface px-6 py-5 text-left shadow-[var(--shadow-card)] transition hover:scale-[1.005]"
      >
        <span className="text-[15px] text-muted">Portfolio</span>
        <span className={`text-[17px] font-semibold tabular-nums ${profitTone(life.profit)}`}>
          {signedMoney(life.profit, true)} <span className="text-faint">›</span>
        </span>
      </button>

      {health?.accounts && !reveal.saved && (
        <p className="text-center">
          <Button variant="plain" onClick={() => openSheet('account')}>
            Sign in to save
          </Button>
        </p>
      )}
      {reveal.saved && <p className="text-center text-[15px] text-win">✓ Saved</p>}
      {game?.class_name && <p className="text-center text-[15px] text-win">✓ Sent to {game.class_name}</p>}

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Button
          size="lg"
          variant="secondary"
          onClick={async () => {
            const result = await share(shareText(reveal))
            setShared(result === 'copied' ? 'Copied!' : result === 'failed' ? 'Couldn’t share' : null)
            setTimeout(() => setShared(null), 2000)
          }}
        >
          {shared ?? 'Share'}
        </Button>
        <Button size="lg" onClick={() => start('random')} disabled={busy} className="min-w-48">
          Play again
        </Button>
      </div>
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
      const k = Math.min(1, (t - t0) / 1100)
      setN(Math.round(value * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduce])
  return <span className={className}>{money(reduce ? value : n, { compact: true })}</span>
}
