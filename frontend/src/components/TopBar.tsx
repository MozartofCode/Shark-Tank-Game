import { money } from '../lib/format'
import { useGame } from '../store/gameStore'

export function TopBar() {
  const game = useGame((s) => s.game)
  const viewIndex = useGame((s) => s.viewIndex)
  const quit = useGame((s) => s.quit)
  if (!game) return null
  const deployed = game.bankroll_start - game.cash

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <button onClick={quit} className="font-display text-lg tracking-wide text-gold" title="Back to lobby">
          TANK DAY
        </button>
        <ol className="flex items-center gap-1.5" aria-label="Pitch progress">
          {game.rounds.map((r, i) => (
            <li
              key={r.index}
              title={r.pitch.company.name}
              className={`h-2 w-8 rounded-full ${
                r.status === 'closed'
                  ? r.winner?.investor === 'player'
                    ? 'bg-win'
                    : 'bg-muted/50'
                  : i === viewIndex
                    ? 'bg-gold'
                    : 'bg-line'
              }`}
            />
          ))}
        </ol>
        <div className="ml-auto flex items-center gap-5 text-sm">
          <div>
            <span className="text-muted">Cash </span>
            <span className="font-semibold tabular-nums">{money(game.cash)}</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-muted">Invested </span>
            <span className="font-semibold text-gold tabular-nums">{money(deployed)}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
