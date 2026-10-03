import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { money, pct, valuation } from '../lib/format'
import { useGame } from '../store/gameStore'
import type { RoundView } from '../types'
import { Term } from './Term'
import { Button, Card } from './ui'

const MIN_AMOUNT = 10_000
const MAX_ASK_MULTIPLE = 5

export function OfferSlip({ round, cash }: { round: RoundView; cash: number }) {
  const { offer, pass, busy } = useGame()
  const ask = round.pitch.ask
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
  const beatsSharks = yourValue >= bestShark

  const problem = !canInvest
    ? 'No money left today.'
    : amount < MIN_AMOUNT
      ? `Minimum ${money(MIN_AMOUNT, { compact: true })}.`
      : amount > cash
        ? `You have ${money(cash, { compact: true })} left.`
        : amount > ask.amount * MAX_ASK_MULTIPLE
          ? `Maximum ${money(ask.amount * MAX_ASK_MULTIPLE, { compact: true })}.`
          : equityPct < 1 || equityPct > 90
            ? 'Pick 1% to 90%.'
            : null

  return (
    <Card className="mx-auto max-w-2xl p-6 sm:p-8">
      <h2 className="text-[22px] font-semibold">Your offer</h2>

      <div className="mt-6 space-y-6">
        <SliderRow
          label="You invest"
          name="Amount"
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
          label={<Term id="equity">You get</Term>}
          name="Percent of the company"
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

      <div className="mt-7 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-fill px-5 py-4 text-[15px]">
        <span>
          <Term id="valuation">Valuation</Term>{' '}
          <strong className="font-semibold">{money(yourValue, { compact: true })}</strong>
          <span className="text-muted"> · asked {money(round.pitch.implied_valuation, { compact: true })}</span>
        </span>
        {bestShark > 0 && (
          <span className={`text-[13px] font-medium ${beatsSharks ? 'text-win' : 'text-warn'}`}>
            {beatsSharks ? '✓ Beats the sharks' : 'A shark offers more'}
          </span>
        )}
      </div>

      {problem && <p className="mt-4 text-[15px] text-loss">{problem}</p>}

      <div className="mt-7 grid grid-cols-2 gap-3">
        <Button size="lg" variant="secondary" onClick={pass} disabled={busy}>
          Pass
        </Button>
        <Button size="lg" onClick={() => offer(amount, equity)} disabled={busy || !!problem}>
          <span className="sm:hidden">Offer</span>
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
  name,
  display,
  value,
  onChange,
  min,
  max,
  step,
  disabled,
  parse,
}: {
  label: ReactNode
  name: string
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
        <input
          aria-label={name}
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
          className="w-40 shrink-0 rounded-lg bg-transparent px-1 text-right text-[28px] font-semibold tabular-nums outline-none placeholder:text-faint focus:bg-fill"
        />
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
        aria-label={`${name} slider`}
      />
    </div>
  )
}
