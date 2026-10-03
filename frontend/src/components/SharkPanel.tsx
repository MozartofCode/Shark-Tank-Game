import { money, pct } from '../lib/format'
import type { SharkPersona, SharkReaction } from '../types'
import { Avatar, Pill } from './ui'

/** The four sharks' decisions on the current company. */
export function SharkPanel({
  sharks,
  reactions,
  winner,
}: {
  sharks: SharkPersona[]
  reactions: SharkReaction[]
  winner?: string | null
}) {
  const byId = new Map(reactions.map((r) => [r.shark_id, r]))
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {sharks.map((s, i) => {
        const r = byId.get(s.id)
        const won = winner === s.id
        return (
          <div
            key={s.id}
            className={`animate-fade-up flex flex-col rounded-3xl bg-surface p-4 shadow-[var(--shadow-card)] transition ${
              won ? 'ring-2 ring-accent' : ''
            } ${r?.decision === 'out' ? 'opacity-70' : ''}`}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-center gap-3">
              <Avatar emoji={s.avatar} color={s.color} size={36} />
              <p className="min-w-0 flex-1 truncate text-[15px] font-semibold" title={s.title}>
                {s.name.split(' ')[0]}
              </p>
            </div>
            {r && <p className="mt-3 flex-1 text-[13px] leading-snug text-muted">“{r.comment}”</p>}
            <div className="mt-3">
              {r?.offer ? (
                <p className="text-[15px]">
                  <span className="font-semibold">{money(r.offer.amount, { compact: true })}</span>
                  <span className="text-muted"> for </span>
                  <span className="font-semibold">{pct(r.offer.equity)}</span>
                </p>
              ) : (
                <Pill>Out</Pill>
              )}
              {won && (
                <Pill tone="accent" className="mt-2">
                  Won
                </Pill>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
