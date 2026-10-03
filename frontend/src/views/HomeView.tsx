import { Leaderboard } from '../components/Leaderboard'
import { Button } from '../components/ui'
import { money, profitTone, signedMoney } from '../lib/format'
import { dailyStreak } from '../lib/achievements'
import { totals } from '../lib/portfolio'
import { resumeGame, useGame } from '../store/gameStore'

const STEPS = [
  { icon: '🎬', title: 'Watch' },
  { icon: '💬', title: 'Ask' },
  { icon: '💸', title: 'Invest' },
  { icon: '⏩', title: 'Find out' },
]

export function HomeView() {
  const { start, busy, health, game, portfolio, openPortfolio } = useGame()
  const bankroll = health?.bankroll ?? 1_000_000
  const inProgress = game && !game.revealed
  const t = totals(portfolio)
  const streak = dailyStreak(portfolio)

  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="animate-fade-up flex flex-col items-center pt-20 pb-16 text-center sm:pt-28">
        <h1 className="text-[56px] leading-[1.02] font-bold sm:text-[88px]">
          Invest like a <span className="text-gradient">Shark.</span>
        </h1>
        <p className="mt-6 max-w-lg text-[19px] leading-relaxed text-muted sm:text-[21px]">
          {money(bankroll, { compact: true })} a day. Five real companies. Some made millions, some went broke.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {inProgress ? (
            <>
              <Button size="lg" onClick={resumeGame}>
                {game.finished ? 'See results' : 'Continue'}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => start('random')} disabled={busy}>
                New day
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={() => start('random')} disabled={busy} className="min-w-36">
                Play
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => start('daily')}
                disabled={busy}
                title="Same five companies for everyone today"
              >
                Daily challenge
              </Button>
            </>
          )}
        </div>

        {t.days > 0 && (
          <button
            onClick={openPortfolio}
            className="mt-10 flex items-center gap-4 rounded-full bg-surface py-2.5 pr-4 pl-5 shadow-[var(--shadow-card)] transition hover:scale-[1.01]"
          >
            <span className="text-[15px] text-muted">Portfolio</span>
            <span className={`text-[15px] font-semibold tabular-nums ${profitTone(t.profit)}`}>
              {signedMoney(t.profit, true)}
            </span>
            {streak >= 2 && <span className="text-[15px] text-warn">🔥 {streak}</span>}
            <span className="text-faint" aria-hidden>
              ›
            </span>
          </button>
        )}
      </section>

      <section className="grid grid-cols-4 gap-px overflow-hidden rounded-3xl bg-line shadow-[var(--shadow-card)]">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex flex-col items-center gap-3 bg-surface px-2 py-7 text-center">
            <span className="text-3xl" aria-hidden>
              {s.icon}
            </span>
            <span className="text-[15px] font-semibold">
              <span className="text-faint">{i + 1} </span>
              {s.title}
            </span>
          </div>
        ))}
      </section>

      {health?.leaderboards && (
        <section className="mx-auto mt-16 max-w-xl">
          <Leaderboard />
        </section>
      )}
    </main>
  )
}
