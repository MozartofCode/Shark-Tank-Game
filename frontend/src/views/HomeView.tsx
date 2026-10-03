import { AccountPanel } from '../components/AccountPanel'
import { Leaderboard } from '../components/Leaderboard'
import { Button, Card, Eyebrow } from '../components/ui'
import { money } from '../lib/format'
import { resumeGame, useGame } from '../store/gameStore'

const STEPS = [
  { n: '1', title: 'Watch the pitch', body: 'Real founders, real pitches, embedded from official Shark Tank channels.' },
  { n: '2', title: 'Grill the founder', body: 'Ask up to 3 questions. An AI founder answers using only what they knew that day.' },
  { n: '3', title: 'Make your offer', body: 'Compete with four AI sharks. Too low and the founder walks; too high and you overpay.' },
  { n: '4', title: 'Fast-forward', body: 'See what really happened to each company and what your stake would be worth.' },
]

export function HomeView() {
  const { start, busy, health, sharks, game } = useGame()
  const bankroll = health?.bankroll ?? 10_000_000
  const canResume = game && !game.revealed

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
      <section className="animate-rise text-center">
        <Eyebrow>Five pitches · {money(bankroll, { compact: true })} · one day in the tank</Eyebrow>
        <h1 className="mt-4 font-display text-5xl leading-none tracking-tight sm:text-7xl">
          TANK <span className="text-gold">DAY</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-[#c3cde0]">
          Take a seat on the panel. You have {money(bankroll, { compact: true })} and five real pitches. Back the
          winners, dodge the flops, and find out years later who was right.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => start('random')} disabled={busy} className="px-8 py-3 text-base">
            {busy ? 'Setting the stage…' : 'Start a new day'}
          </Button>
          <Button variant="ghost" onClick={() => start('daily')} disabled={busy} className="px-6 py-3 text-base">
            ☀️ Daily challenge
          </Button>
          {canResume && (
            <Button variant="ghost" onClick={resumeGame} className="px-6 py-3 text-base">
              {game.finished
                ? 'See your results'
                : `Resume pitch ${game.current_round + 1} of ${game.total_rounds}`}
            </Button>
          )}
        </div>
        {health?.accounts && (
          <div className="mt-6">
            <AccountPanel />
            <p className="mt-2 text-xs text-muted">Sign in to save your runs and join the leaderboard. No password needed.</p>
          </div>
        )}
        {health && !health.ai_founder && (
          <p className="mt-4 text-xs text-muted">Offline founder mode. Add an Anthropic API key for live AI answers.</p>
        )}
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <Card key={s.n} className="animate-rise">
            <span className="font-display text-3xl text-gold/80">
              {s.n}
            </span>
            <p className="mt-2 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-muted">{s.body}</p>
          </Card>
        ))}
      </section>

      {health?.leaderboards && (
        <section className="mx-auto mt-16 max-w-2xl">
          <Leaderboard />
        </section>
      )}

      {sharks.length > 0 && (
        <section className="mt-16">
          <Eyebrow>Your fellow sharks</Eyebrow>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sharks.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-full text-2xl"
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
                <p className="mt-2 text-xs text-muted italic">“{s.catchphrase}”</p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
