import { money } from '../lib/format'
import { useAuth } from '../store/authStore'
import { useGame } from '../store/gameStore'

/** Translucent top bar. In a game it shows progress and money left; elsewhere, quick links. */
export function Nav() {
  const { game, viewIndex, screen, goHome, openPortfolio, openSheet, openLearn, health } = useGame()
  const email = useAuth((s) => s.email)
  const inGame = screen === 'game' && game

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/75 backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex h-12 max-w-5xl items-center gap-4 px-5 text-[13px]">
        <button onClick={goHome} className="flex items-center gap-2 font-semibold tracking-tight" aria-label="Tank Day home">
          <img src="/favicon.svg" alt="" className="h-6 w-6" />
          <span className="text-[15px]">Tank Day</span>
        </button>

        {inGame ? (
          <>
            <div className="mx-auto flex items-center gap-1.5" aria-label={`Company ${viewIndex + 1} of ${game.total_rounds}`}>
              <span className="mr-1.5 text-muted tabular-nums">
                {viewIndex + 1}/{game.total_rounds}
              </span>
              {game.rounds.map((r, i) => (
                <span
                  key={r.index}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === viewIndex ? 'w-6 bg-fg' : r.status === 'closed' ? 'w-1.5 bg-fg/50' : 'w-1.5 bg-fg/15'
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold tabular-nums" title="Money left to invest today">
              {money(game.cash, { compact: true })}
            </span>
          </>
        ) : (
          <div className="ml-auto flex items-center gap-5 text-muted">
            <button onClick={openLearn} className={`transition hover:text-fg ${screen === 'learn' ? 'text-fg' : ''}`}>
              Learn
            </button>
            <button onClick={openPortfolio} className={`transition hover:text-fg ${screen === 'portfolio' ? 'text-fg' : ''}`}>
              Portfolio
            </button>
            {health?.accounts && (
              <button onClick={() => openSheet('account')} className="transition hover:text-fg">
                {email ? 'Account' : 'Sign in'}
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
