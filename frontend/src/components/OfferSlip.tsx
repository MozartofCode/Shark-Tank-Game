import { useMemo, useState, type CSSProperties } from 'react'
import { money, pct, valuation } from '../lib/format'
import { useGame } from '../store/gameStore'
import type { RoundView } from '../types'
import { Button, Card } from './ui'

const MIN_AMOUNT = 10_000
const MAX_ASK_MULTIPLE = 5

export function OfferSlip({ round, cash }: { round: RoundView; cash: number }) {
  const { offer, pass, busy } = useGame()
  const ask = round.pitch.ask
  const name = round.pitch.company.name
  const maxAmount = Math.min(cash, ask.amount * MAX_ASK_MULTIPLE)
  const canInvest = maxAmount >= MIN_AMOUNT
  const [amount, setAmount] = useState(Math.max(MIN_AMOUNT, Math.min(ask.amount, maxAmount)))
  const [equityPct, setEquityPct] = useState(Math.round(ask.equity * 1000) / 10)

  const equity = equityPct / 100
  const yourValue = valuation(amount, equity)
  const bestShark = useMemo(
    () =>
      Math.max(0, ...round.shark_reactions.filter((r) => r.offer).map((r) => valuation(r.offer!.amount, r.offer!.equity))),
    [round.shark_reactions],
  )

  const problem = !canInvest
    ? 'You’ve used up today’s money. Pass on this one.'
    : amount < MIN_AMOUNT
      ? `The smallest offer is ${money(MIN_AMOUNT)}.`
      : amount > cash
        ? `You only have ${money(cash)} left today.`
        : amount > ask.amount * MAX_ASK_MULTIPLE
          ? `That’s more than they need. The most you can offer is ${money(ask.amount * MAX_ASK_MULTIPLE)}.`
          : equityPct < 1 || equityPct > 90
            ? 'Choose between 1% and 90%.'
            : null

  const hint = !bestShark
    ? 'No shark made an offer, so yours is the only one.'
    : yourValue >= bestShark
      ? 'That’s at least as high as any shark’s price. The founder will like that.'
      : 'A shark values the company higher than you do. The founder may choose them instead.'

  return (
    <Card className="mx-auto max-w-2xl p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[22px] font-semibold">Your offer</h2>
        <p className="text-[13px] text-muted">{money(cash)} left to invest today</p>
      </div>

      <div className="mt-6 space-y-6">
        <SliderRow
          label="You invest"
          display={money(amount)}
          value={amount}
          onChange={setAmount}
          min={MIN_AMOUNT}
          max={Math.max(MIN_AMOUNT, maxAmount)}
          step={5_000}
          disabled={!canInvest}
          parse={(s) => Number(s.replace(/[^0-9]/g, ''))}
        />
        <SliderRow
          label="Your share"
          display={`${equityPct}%`}
          value={equityPct}
          onChange={setEquityPct}
          min={1}
          max={90}
          step={0.5}
          disabled={!canInvest}
          parse={(s) => Number(s.replace(/[^0-9.]/g, ''))}
        />
      </div>

      <div className="mt-7 rounded-2xl bg-fill px-5 py-4">
        <p className="text-[15px] leading-relaxed">
          This says {name} is worth{' '}
          <strong className="font-semibold">{money(yourValue, { compact: true })}</strong>. The founder said{' '}
          {money(round.pitch.implied_valuation, { compact: true })}.
        </p>
        <p className="mt-1 text-[13px] text-muted">{hint}</p>
      </div>

      {problem && <p className="mt-4 text-[15px] text-loss">{problem}</p>}

      <div className="mt-7 grid grid-cols-2 gap-3">
        <Button size="lg" variant="secondary" onClick={pass} disabled={busy}>
          Pass
        </Button>
        <Button size="lg" onClick={() => offer(amount, equity)} disabled={busy || !!problem}>
          <span className="sm:hidden">Make offer</span>
          <span className="hidden sm:inline">
            Offer {money(amount, { compact: true })} for {pct(equity)}
          </span>
        </Button>
      </div>
    </Card>
  )
}

function SliderRow({
  label,
  display,
  value,
  onChange,
  min,
  max,
  step,
  disabled,
  parse,
}: {
  label: string
  display: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  disabled: boolean
  parse: (s: string) => number
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const clamped = Math.min(Math.max(value, min), max)
  const fill = max > min ? ((clamped - min) / (max - min)) * 100 : 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-[15px] text-muted">{label}</span>
        <span className="shrink-0">
          <input
            aria-label={label}
            inputMode="decimal"
            disabled={disabled}
            value={editing ?? display}
            placeholder={display}
            onFocus={() => setEditing('')}
            onChange={(e) => {
              setEditing(e.target.value)
              const n = parse(e.target.value)
              if (e.target.value.trim() && !Number.isNaN(n)) onChange(n)
            }}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            onBlur={() => {
              const n = parse(editing ?? '')
              if (editing?.trim() && !Number.isNaN(n)) onChange(Math.min(Math.max(n, min), max))
              setEditing(null)
            }}
            className="w-40 rounded-lg bg-transparent px-1 text-right text-[28px] font-semibold tabular-nums outline-none placeholder:text-faint focus:bg-fill"
          />
        </span>
      </div>
      <input
        type="range"
        className="slider mt-2"
        style={{ '--pct': `${fill}%` } as CSSProperties}
        min={min}
        max={max}
        step={step}
        value={clamped}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} slider`}
      />
    </div>
  )
}
