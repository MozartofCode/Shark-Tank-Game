import { useEffect } from 'react'
import { Nav } from './components/Nav'
import { Sheets } from './components/Sheets'
import { useGame } from './store/gameStore'
import { GameView } from './views/GameView'
import { HomeView } from './views/HomeView'
import { LearnView } from './views/LearnView'
import { PortfolioView } from './views/PortfolioView'
import { RevealView } from './views/RevealView'

export default function App() {
  const { screen, boot, error, clearError } = useGame()

  useEffect(() => {
    void boot()
  }, [boot])

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <div key={screen} className="animate-fade-in flex-1">
        {screen === 'home' && <HomeView />}
        {screen === 'game' && <GameView />}
        {screen === 'reveal' && <RevealView />}
        {screen === 'portfolio' && <PortfolioView />}
        {screen === 'learn' && <LearnView />}
      </div>

      <Sheets />

      {error && (
        <div
          role="alert"
          className="animate-sheet-up fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-surface px-5 py-4 text-[15px] shadow-[var(--shadow-float)]"
        >
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="font-medium text-accent">
            OK
          </button>
        </div>
      )}

      <footer className="mx-auto w-full max-w-5xl px-5 py-10 text-xs leading-relaxed text-faint">
        <div className="border-t border-line pt-6">
          A learning game, not financial advice. Videos belong to their owners. Not affiliated with Shark Tank; the
          sharks are fictional.
        </div>
      </footer>
    </div>
  )
}
