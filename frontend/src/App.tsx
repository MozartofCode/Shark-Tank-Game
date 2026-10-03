import { useEffect } from 'react'
import { TopBar } from './components/TopBar'
import { useGame } from './store/gameStore'
import { GameView } from './views/GameView'
import { HomeView } from './views/HomeView'
import { RevealView } from './views/RevealView'

export default function App() {
  const { screen, boot, error, clearError } = useGame()

  useEffect(() => {
    void boot()
  }, [boot])

  return (
    <div className="flex min-h-screen flex-col">
      {screen !== 'home' && <TopBar />}
      <div className="flex-1">
        {screen === 'home' && <HomeView />}
        {screen === 'game' && <GameView />}
        {screen === 'reveal' && <RevealView />}
      </div>

      {error && (
        <div role="alert" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg items-start gap-3 rounded-xl border border-loss/50 bg-stage p-4 text-sm shadow-2xl">
          <span className="flex-1 text-loss">{error}</span>
          <button onClick={clearError} className="text-muted hover:text-[#e6ecf7]" aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <footer className="border-t border-line/60 px-4 py-6 text-center text-xs leading-relaxed text-muted">
        Educational game, not financial advice. Company outcomes are based on public reporting; private-company values
        are estimates.
        <br />
        Pitch clips are embedded from official Shark Tank YouTube channels; all rights belong to their owners. Tank Day
        is not affiliated with Shark Tank, ABC or Sony Pictures Television. The sharks are fictional characters.
      </footer>
    </div>
  )
}
