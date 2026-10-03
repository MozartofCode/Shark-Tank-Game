import { money, pct, valuation } from '../lib/format'
import type { SharkPersona, SharkReaction } from '../types'

type Mode = 'questions' | 'offers'

export function SharkPanel({
  sharks,
  reactions,
  mode,
  winner,
}: {
  sharks: SharkPersona[]
  reactions: SharkReaction[]
  mode: Mode
  winner?: string | null
}) {
  const byId = new Map(reactions.map((r) => [r.shark_id, r]))
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {sharks.map((s, i) => (
        <SharkSeat key={s.id} shark={s} reaction={byId.get(s.id)} mode={mode} won={winner === s.id} delay={i * 120} />
      ))}
    </div>
  )
}

function SharkSeat({
  shark,
  reaction,
  mode,
  won,
  delay,
}: {
  shark: SharkPersona
  reaction?: SharkReaction
  mode: Mode
  won: boolean
  delay: number
}) {
  const isIn = reaction?.decision === 'in'
  return (
    <div
      className={`animate-rise relative flex flex-col rounded-2xl border bg-panel/80 p-4 transition ${
        won ? 'border-gold shadow-[0_0_30px_rgb(245_185_66/0.35)]' : 'border-line'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl"
          style={{ background: `${shark.color}22`, boxShadow: `inset 0 0 0 2px ${shark.color}` }}
          aria-hidden
        >
          {shark.avatar}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{shark.name}</p>
          <p className="truncate text-xs text-muted">{shark.title}</p>
        </div>
        {mode === 'offers' && reaction && (
          <span
            className={`ml-auto rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider ${
              isIn ? 'bg-win/15 text-win' : 'bg-loss/15 text-loss'
            }`}
          >
            {isIn ? 'IN' : 'OUT'}
          </span>
        )}
      </div>

      {reaction && (
        <div className="mt-3 rounded-xl bg-panel-2/70 p-3 text-sm leading-snug text-[#cdd6e8]">
          {mode === 'questions' ? (
            <ul className="space-y-1.5">
              {reaction.questions.map((q) => (
                <li key={q}>“{q}”</li>
              ))}
            </ul>
          ) : (
            <p>“{reaction.comment}”</p>
          )}
        </div>
      )}

      {mode === 'offers' && reaction?.offer && (
        <div className="mt-3 rounded-xl border border-line/80 px-3 py-2 text-sm">
          <span className="font-semibold">{money(reaction.offer.amount)}</span>
          <span className="text-muted"> for </span>
          <span className="font-semibold">{pct(reaction.offer.equity)}</span>
          <p className="text-xs text-muted">
            values company at {money(valuation(reaction.offer.amount, reaction.offer.equity), { compact: true })}
          </p>
        </div>
      )}
      {won && <p className="mt-2 text-xs font-semibold text-gold">Got the deal</p>}
    </div>
  )
}
