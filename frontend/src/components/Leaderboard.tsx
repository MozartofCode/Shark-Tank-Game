import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { money, signedPct } from '../lib/format'
import type { LeaderboardEntry } from '../types'
import { Card } from './ui'

type Scope = 'daily' | 'all'

export function Leaderboard() {
  const [scope, setScope] = useState<Scope>('daily')
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    api
      .leaderboard(scope)
      .then((r) => live && (setRows(r), setFailed(false)))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [scope])

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">🏆 Leaderboard (best day)</p>
        <div className="flex rounded-full border border-line p-0.5 text-xs">
          {(['daily', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-full px-3 py-1 ${scope === s ? 'bg-gold font-semibold text-ink' : 'text-muted'}`}
            >
              {s === 'daily' ? 'Today' : 'All time'}
            </button>
          ))}
        </div>
      </div>
      {failed ? (
        <p className="mt-4 text-sm text-muted">Leaderboard unavailable right now.</p>
      ) : rows === null ? (
        <p className="mt-4 text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {scope === 'daily'
            ? 'No one has finished today’s challenge yet. Be the first!'
            : 'No ranked runs yet. Sign in and play to claim the top spot.'}
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-line text-sm">
          {rows.map((r) => (
            <li key={`${r.rank}-${r.username}`} className="flex items-center gap-3 py-2">
              <span className={`w-6 text-right font-bold ${r.rank <= 3 ? 'text-gold' : 'text-muted'}`}>{r.rank}</span>
              <span className="flex-1 truncate">{r.username}</span>
              <span className="tabular-nums">{money(r.net_worth, { compact: true })}</span>
              <span className={`w-20 text-right tabular-nums ${r.return_pct >= 0 ? 'text-win' : 'text-loss'}`}>
                {signedPct(r.return_pct)}
              </span>
            </li>
          ))}
        </ol>
      )}
      {scope === 'daily' && (
        <p className="mt-3 text-xs text-muted">Only your first daily run counts. No replaying with hindsight!</p>
      )}
    </Card>
  )
}
