import { useMemo, useState } from 'react'
import { money, pct, valuation } from '../lib/format'
import { useGame } from '../store/gameStore'
import type { RoundView } from '../types'
import { Button, Learn } from './ui'

const MIN_AMOUNT = 10_000
const MAX_ASK_MULTIPLE = 5

export function OfferSlip({ round, cash }: { round: RoundView; cash: number }) {
  const { offer, pass, busy } = useGame()
  const ask = round.pitch.ask
  const [amount, setAmount] = useState(ask.amount)
  const [equityPct, setEquityPct] = useState(Math.round(ask.equity * 1000) / 10)

  const maxAmount = Math.min(cash, ask.amount * MAX_ASK_MULTIPLE)
  const equity = equityPct / 100
  const yourValuation = valuation(amount, equity)
  const sharkBest = useMemo(
    () =>
      Math.max(
        0,
        ...round.shark_reactions.filter((r) => r.offer).map((r) => valuation(r.offer!.amount, r.offer!.equity)),
      ),
    [round.shark_reactions],
  )
  const problem =
    amount < MIN_AMOUNT
      ? `Minimum offer is ${money(MIN_AMOUNT)}.`
      : amount > cash
        ? `You only have ${money(cash)} left.`
        : amount > ask.amount * MAX_ASK_MULTIPLE
          ? `Capped at ${MAX_ASK_MULTIPLE}× the ask (${money(ask.amount * MAX_ASK_MULTIPLE)}).`
          : equityPct < 1 || equityPct > 90
            ? 'Equity must be between 1% and 90%.'
            : null

  return (
    <div className="rounded-2xl border border-gold/40 bg-panel/90 p-5 shadow-[0_0_40px_rgb(245_185_66/0.08)]">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-lg tracking-wide text-gold">YOUR OFFER</p>
        <p className="text-xs text-muted">
          Founder asked {money(ask.amount)} for {pct(ask.equity)}
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-muted">Investment</span>
          <div className="mt-1 flex items-center rounded-xl border border-line bg-stage px-3 focus-within:border-gold">
            <span className="text-muted">$</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_AMOUNT}
              step={5000}
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-transparent px-2 py-2 text-lg font-semibold tabular-nums outline-none"
            />
          </div>
          <input
            type="range"
            min={MIN_AMOUNT}
            max={Math.max(MIN_AMOUNT, maxAmount)}
            step={5000}
            value={Math.min(amount, maxAmount)}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-2 w-full accent-[#f5b942]"
            aria-label="Investment amount"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">
            <Learn term="Equity">The percentage of the company you'd own in exchange for your money.</Learn>
          </span>
          <div className="mt-1 flex items-center rounded-xl border border-line bg-stage px-3 focus-within:border-gold">
            <input
              type="number"
              inputMode="decimal"
              min={1}
              max={90}
              step={0.5}
              value={equityPct}
              onChange={(e) => setEquityPct(Number(e.target.value))}
              className="w-full bg-transparent py-2 text-lg font-semibold tabular-nums outline-none"
            />
            <span className="text-muted">%</span>
          </div>
          <input
            type="range"
            min={1}
            max={90}
            step={0.5}
            value={equityPct}
            onChange={(e) => setEquityPct(Number(e.target.value))}
            className="mt-2 w-full accent-[#f5b942]"
            aria-label="Equity percentage"
          />
        </label>
      </div>

      <ValuationMeter yours={yourValuation} ask={round.pitch.implied_valuation} sharkBest={sharkBest} />

      {problem && <p className="mt-3 text-sm text-loss">{problem}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => offer(amount, equity)} disabled={busy || !!problem}>
          Make offer: {money(amount, { compact: true })} for {pct(equity)}
        </Button>
        <Button variant="ghost" onClick={pass} disabled={busy}>
          I'm out
        </Button>
      </div>
    </div>
  )
}

function ValuationMeter({ yours, ask, sharkBest }: { yours: number; ask: number; sharkBest: number }) {
  const max = Math.max(yours, ask, sharkBest) * 1.15 || 1
  const marks = [
    { label: 'Founder ask', value: ask, color: 'bg-sea' },
    ...(sharkBest ? [{ label: 'Best shark', value: sharkBest, color: 'bg-[#e0457b]' }] : []),
  ]
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="text-muted">
          Your offer values the company at{' '}
          <Learn term="valuation">
            Valuation = investment ÷ equity. Higher is better for the founder; lower means you get more for your money,
            but a lowball may get rejected.
          </Learn>
        </span>
        <span className="text-lg font-bold text-gold tabular-nums">{money(yours, { compact: true })}</span>
      </div>
      <div className="relative h-3 rounded-full bg-stage">
        <div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold" style={{ width: `${(yours / max) * 100}%` }} />
        {marks.map((m) => (
          <div
            key={m.label}
            className={`absolute -top-1 h-5 w-1 rounded ${m.color}`}
            style={{ left: `${(m.value / max) * 100}%` }}
            title={`${m.label}: ${money(m.value)}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        {marks.map((m) => (
          <span key={m.label} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${m.color}`} />
            {m.label}: {money(m.value, { compact: true })}
          </span>
        ))}
      </div>
    </div>
  )
}
