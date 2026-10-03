import { AccountPanel } from '../components/AccountPanel'
import { Glossary } from '../components/Glossary'
import { Leaderboard } from '../components/Leaderboard'
import { Button, Card, Eyebrow } from '../components/ui'
import { money } from '../lib/format'
import { totals } from '../lib/portfolio'
import { resumeGame, useGame } from '../store/gameStore'

const STEPS = [
  { n: '1', title: 'Watch', body: 'See a real founder pitch their company on Shark Tank.' },
  { n: '2', title: 'Ask', body: 'Ask the founder up to 3 questions before you decide.' },
  { n: '3', title: 'Invest', body: 'Offer money for a slice of the company, or skip it.' },
  { n: '4', title: 'Find out', body: 'Jump years ahead and see if your money grew or vanished.' },
]

export function HomeView() {
  const { start, busy, health, sharks, game, portfolio, openPortfolio } = useGame()
  const bankroll = health?.bankroll ?? 1_000_000
  const inProgress = game && !game.revealed
  const t = totals(portfolio)

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <section className="animate-rise text-center">
        <h1 className="font-display text-5xl leading-none tracking-tight sm:text-7xl">
          TANK <span className="text-gold">DAY</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-[#c3cde0]">
          You're the investor. Every day you get <strong className="text-gold">{money(bankroll)}</strong> to invest in
          5 real companies from Shark Tank. Some became huge. Some went broke. Can you tell which?
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          {inProgress ? (
            <Button onClick={resumeGame} className="px-10 py-3 text-base">
              {game.finished
                ? '▶ See your results'
                : `▶ Continue (company ${game.current_round + 1} of ${game.total_rounds})`}
            </Button>
          ) : (
            <Button onClick={() => start('random')} disabled={busy} className="px-10 py-3 text-base">
              {busy ? 'Getting ready…' : '▶ Play'}
            </Button>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            {inProgress && (
              <Button variant="ghost" onClick={() => start('random')} disabled={busy}>
                Start a new day instead
              </Button>
            )}
            <Button variant="ghost" onClick={() => start('daily')} disabled={busy}>
              ☀️ Daily challenge
            </Button>
            {t.days > 0 && (
              <Button variant="ghost" onClick={openPortfolio}>
                📈 My portfolio ({t.profit >= 0 ? '+' : ''}
                {money(t.profit, { compact: true })})
              </Button>
            )}
          </div>
          <p className="text-xs text-muted">Daily challenge: the same 5 companies for everyone today.</p>
        </div>
      </section>

      <section className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STEPS.map((s) => (
          <Card key={s.n} className="animate-rise">
            <span className="font-display text-2xl text-gold/80">{s.n}</span>
            <p className="mt-1 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-muted">{s.body}</p>
          </Card>
        ))}
      </section>

      <section className="mt-8">
        <Glossary />
      </section>

      {health?.accounts && (
        <section className="mt-8">
          <Card className="text-center">
            <p className="font-semibold">Save your portfolio</p>
            <p className="mt-1 mb-4 text-sm text-muted">
              Sign in to keep your portfolio on any device and get on the leaderboard. No password needed.
            </p>
            <AccountPanel />
          </Card>
        </section>
      )}

      {health?.leaderboards && (
        <section className="mt-8">
          <Leaderboard />
        </section>
      )}

      {sharks.length > 0 && (
        <section className="mt-14">
          <Eyebrow>You'll compete with these sharks</Eyebrow>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sharks.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-full text-xl"
                    style={{ background: `${s.color}22`, boxShadow: `inset 0 0 0 2px ${s.color}` }}
                    aria-hidden
                  >
                    {s.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-muted">{s.title}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#c3cde0]">{s.bio}</p>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">These sharks are made-up characters, not the real Shark Tank cast.</p>
        </section>
      )}

      {health && !health.ai_founder && (
        <p className="mt-10 text-center text-xs text-muted">
          Founder answers are in simple offline mode. Add an Anthropic API key for full AI answers.
        </p>
      )}
    </main>
  )
}
