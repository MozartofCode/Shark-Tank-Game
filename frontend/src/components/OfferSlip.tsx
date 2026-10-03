import { useMemo, useState } from 'react'
import { money, pct, valuation } from '../lib/format'
import { useGame } from '../store/gameStore'
import type { RoundView } from '../types'
import { Button } from './ui'

const MIN_AMOUNT = 10_000
const MAX_ASK_MULTIPLE = 5

export function OfferSlip({ round, cash }: { round: RoundView; cash: number }) {
  const { offer, pass, busy } = useGame()
  const ask = round.pitch.ask
  const name = round.pitch.company.name
  const maxAmount = Math.min(cash, ask.amount * MAX_ASK_MULTIPLE)
  const [amount, setAmount] = useState(Math.min(ask.amount, maxAmount))
  const [equityPct, setEquityPct] = useState(Math.round(ask.equity * 1000) / 10)

  const equity = equityPct / 100
  const yourValue = valuation(amount, equity)
  const bestShark = useMemo(() => {
    const offers = round.shark_reactions.filter((r) => r.offer)
    if (!offers.length) return null
    return offers.reduce((best, r) =>
      valuation(r.offer!.amount, r.offer!.equity) > valuation(best.offer!.amount, best.offer!.equity) ? r : best,
    ).offer!
  }, [round.shark_reactions])

  const problem =
    cash < MIN_AMOUNT
      ? "You're out of money for today. Skip this one."
      : amount < MIN_AMOUNT
        ? `The smallest offer is ${money(MIN_AMOUNT)}.`
        : amount > cash
          ? `You only have ${money(cash)} left today.`
          : amount > ask.amount * MAX_ASK_MULTIPLE
            ? `That's way more than they need. The most you can offer is ${money(ask.amount * MAX_ASK_MULTIPLE)}.`
            : equityPct < 1 || equityPct > 90
              ? 'Pick between 1% and 90% of the company.'
              : null

  return (
    <div className="rounded-2xl border border-gold/40 bg-panel/90 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-lg tracking-wide text-gold">YOUR OFFER</p>
        <p className="text-sm text-muted">
          Money left today: <span className="font-semibold text-[#e6ecf7]">{money(cash)}</span>
        </p>
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <Field
          label="How much money will you invest?"
          prefix="$"
          value={amount}
          onChange={setAmount}
          min={MIN_AMOUNT}
          max={Math.max(MIN_AMOUNT, maxAmount)}
          step={5000}
        />
        <Field
          label="How much of the company do you want?"
          suffix="%"
          value={equityPct}
          onChange={setEquityPct}
          min={1}
          max={90}
          step={0.5}
        />
      </div>

      <div className="mt-5 rounded-xl bg-stage/70 p-4 text-sm leading-relaxed">
        <p>
          You'd pay <strong className="text-gold">{money(amount)}</strong> for{' '}
          <strong className="text-gold">{pct(equity)}</strong> of {name}. That means you think the whole company is
          worth <strong className="text-gold">{money(yourValue, { compact: true })}</strong>.
        </p>
        <ul className="mt-3 grid gap-2 text-muted sm:grid-cols-2">
          <li>
            The founder thinks it's worth{' '}
            <span className="text-[#e6ecf7]">{money(round.pitch.implied_valuation, { compact: true })}</span>
          </li>
          <li>
            {bestShark ? (
              <>
                Best shark offer values it at{' '}
                <span className="text-[#e6ecf7]">
                  {money(valuation(bestShark.amount, bestShark.equity), { compact: true })}
                </span>
              </>
            ) : (
              'No shark made an offer'
            )}
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted">
          💡 Asking for a bigger slice is a better deal for you, but the founder may say no. The founder picks the offer
          that values their company highest.
        </p>
      </div>

      {problem && <p className="mt-3 text-sm text-loss">{problem}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => offer(amount, equity)} disabled={busy || !!problem}>
          Send offer
        </Button>
        <Button variant="ghost" onClick={pass} disabled={busy}>
          Skip this company
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  prefix,
  suffix,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string
  prefix?: string
  suffix?: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-2 flex items-center rounded-xl border border-line bg-stage px-3 focus-within:border-gold">
        {prefix && <span className="text-muted">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent px-2 py-2 text-lg font-semibold tabular-nums outline-none"
        />
        {suffix && <span className="text-muted">{suffix}</span>}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(Math.max(value, min), max)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-[#f5b942]"
        aria-label={label}
      />
    </label>
  )
}
