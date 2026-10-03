import { Leaderboard } from '../components/Leaderboard'
import { Button } from '../components/ui'
import { money, profitTone, signedMoney } from '../lib/format'
import { totals } from '../lib/portfolio'
import { resumeGame, useGame } from '../store/gameStore'

const STEPS = [
  { icon: '🎬', title: 'Watch', body: 'A real founder pitches on Shark Tank.' },
  { icon: '💬', title: 'Ask', body: 'Question them before you decide.' },
  { icon: '💸', title: 'Invest', body: 'Offer money for a slice, or pass.' },
  { icon: '⏩', title: 'Find out', body: 'Skip ahead years and see what happened.' },
]

export function HomeView() {
  const { start, busy, health, game, portfolio, openPortfolio } = useGame()
  const bankroll = health?.bankroll ?? 1_000_000
  const inProgress = game && !game.revealed
  const t = totals(portfolio)

  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="animate-fade-up flex flex-col items-center pt-20 pb-16 text-center sm:pt-28">
        <h1 className="text-[56px] leading-[1.02] font-bold sm:text-[88px]">
          Invest like a <span className="text-gradient">Shark.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[19px] leading-relaxed text-muted sm:text-[21px]">
          Every day you get {money(bankroll)} and five real companies from Shark Tank. Some went on to make millions.
          Some went broke. It’s your call.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {inProgress ? (
            <>
              <Button size="lg" onClick={resumeGame}>
                {game.finished ? 'See your results' : 'Continue playing'}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => start('random')} disabled={busy}>
                New day
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={() => start('random')} disabled={busy} className="min-w-36">
                {busy ? 'Loading…' : 'Play'}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => start('daily')} disabled={busy}>
                Daily challenge
              </Button>
            </>
          )}
        </div>
        {!inProgress && (
          <p className="mt-4 text-[13px] text-faint">The daily challenge has the same five companies for everyone.</p>
        )}

        {t.days > 0 && (
          <button
            onClick={openPortfolio}
            className="mt-10 flex items-center gap-4 rounded-full bg-surface py-2.5 pr-4 pl-5 text-left shadow-[var(--shadow-card)] transition hover:scale-[1.01]"
          >
            <span className="text-[15px] text-muted">Your portfolio</span>
            <span className={`text-[15px] font-semibold tabular-nums ${profitTone(t.profit)}`}>
              {signedMoney(t.profit, true)}
            </span>
            <span className="text-faint" aria-hidden>
              ›
            </span>
          </button>
        )}
      </section>

      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-line shadow-[var(--shadow-card)] lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.title} className="bg-surface p-6">
            <span className="text-3xl" aria-hidden>
              {s.icon}
            </span>
            <p className="mt-4 text-[17px] font-semibold">{s.title}</p>
            <p className="mt-1 text-[15px] leading-snug text-muted">{s.body}</p>
          </div>
        ))}
      </section>

      {health?.leaderboards && (
        <section className="mx-auto mt-16 max-w-xl">
          <Leaderboard />
        </section>
      )}

      {health && !health.ai_founder && (
        <p className="mt-12 text-center text-xs text-faint">
          Founder answers are running in simple offline mode. Add an Anthropic API key for full AI answers.
        </p>
      )}
    </main>
  )
}
