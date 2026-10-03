import { money } from '../lib/format'
import { useGame } from '../store/gameStore'

export function TopBar() {
  const { game, viewIndex, screen, goHome } = useGame()

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <button onClick={goHome} className="font-display text-lg tracking-wide text-gold" title="Go to the home screen">
          TANK DAY
        </button>
        {game && screen === 'game' && (
          <>
            {game.daily_date && (
              <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-semibold text-gold">Daily challenge</span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">
                Company {viewIndex + 1}/{game.total_rounds}
              </span>
              <ol className="flex items-center gap-1" aria-hidden>
                {game.rounds.map((r, i) => (
                  <li
                    key={r.index}
                    className={`h-1.5 w-6 rounded-full ${
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
            </div>
            <div className="ml-auto text-sm">
              <span className="text-muted">Money left today: </span>
              <span className="font-semibold tabular-nums">{money(game.cash)}</span>
            </div>
          </>
        )}
        {screen !== 'game' && (
          <button onClick={goHome} className="ml-auto text-sm text-muted hover:text-[#e6ecf7]">
            ← Home
          </button>
        )}
      </div>
    </header>
  )
}
