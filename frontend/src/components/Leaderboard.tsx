import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { money, profitTone, signedPct } from '../lib/format'
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
        <h2 className="text-[17px] font-semibold">Leaderboard</h2>
        <div className="inline-flex rounded-full bg-fill p-0.5 text-[13px]">
          {(['daily', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`h-7 rounded-full px-3 transition ${scope === s ? 'bg-surface font-medium shadow-[0_1px_3px_rgb(0_0_0/0.12)]' : 'text-muted'}`}
            >
              {s === 'daily' ? 'Today' : 'All time'}
            </button>
          ))}
        </div>
      </div>
      {failed ? (
        <p className="mt-4 text-[15px] text-muted">The leaderboard isn’t available right now.</p>
      ) : rows === null ? (
        <p className="mt-4 text-[15px] text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-[15px] text-muted">
          {scope === 'daily' ? 'Nobody has finished today’s challenge yet. Be the first.' : 'No ranked days yet.'}
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-line">
          {rows.map((r) => (
            <li key={`${r.rank}-${r.username}`} className="flex items-center gap-3 py-3 text-[15px]">
              <span className="w-6 text-right font-semibold text-faint tabular-nums">{r.rank}</span>
              <span className="flex-1 truncate">{r.username}</span>
              <span className="text-muted tabular-nums">{money(r.net_worth, { compact: true })}</span>
              <span className={`w-20 text-right font-semibold tabular-nums ${profitTone(r.return_pct)}`}>
                {signedPct(r.return_pct)}
              </span>
            </li>
          ))}
        </ol>
      )}
      {scope === 'daily' && <p className="mt-3 text-[13px] text-faint">Only your first try at the daily challenge counts.</p>}
    </Card>
  )
}
