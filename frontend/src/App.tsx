import { useEffect } from 'react'
import { Nav } from './components/Nav'
import { Sheets } from './components/Sheets'
import { useGame } from './store/gameStore'
import { GameView } from './views/GameView'
import { ClassroomView } from './views/ClassroomView'
import { HomeView } from './views/HomeView'
import { TeacherView } from './views/TeacherView'
import { LearnView } from './views/LearnView'
import { PrivacyView, TermsView } from './views/LegalView'
import { PortfolioView } from './views/PortfolioView'
import { RevealView } from './views/RevealView'

export default function App() {
  const { screen, boot, error, clearError, openPage } = useGame()

  useEffect(() => {
    void boot()
  }, [boot])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:shadow-[var(--shadow-float)]"
      >
        Skip to content
      </a>
      <Nav />
      <div key={screen} id="content" tabIndex={-1} className="animate-fade-in flex-1 outline-none">
        {screen === 'home' && <HomeView />}
        {screen === 'game' && <GameView />}
        {screen === 'reveal' && <RevealView />}
        {screen === 'portfolio' && <PortfolioView />}
        {screen === 'learn' && <LearnView />}
        {screen === 'privacy' && <PrivacyView />}
        {screen === 'terms' && <TermsView />}
        {screen === 'classroom' && <ClassroomView />}
        {screen === 'teacher' && <TeacherView />}
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
          <span className="mt-3 flex gap-4">
            <button onClick={() => openPage('privacy')} className="hover:text-muted">
              Privacy
            </button>
            <button onClick={() => openPage('terms')} className="hover:text-muted">
              Terms
            </button>
          </span>
        </div>
      </footer>
    </div>
  )
}
