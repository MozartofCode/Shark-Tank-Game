import { money, pct } from '../lib/format'
import { useGame } from '../store/gameStore'
import type { GameView, RoundView, SharkPersona } from '../types'
import { Term } from './Term'
import { ValuationQuiz } from './ValuationQuiz'
import { Button, Card } from './ui'

/** What the founder decided: deal, counteroffer, or no deal. */
export function DecisionBanner({ game, round, sharks }: { game: GameView; round: RoundView; sharks: SharkPersona[] }) {
  const { respondCounter, next, showReveal, busy } = useGame()
  const mine = round.winner?.investor === 'player'
  const sharkName = sharks.find((s) => s.id === round.winner?.investor)?.name.split(' ')[0]
  const countered = round.status === 'countered' && round.counter

  const icon = countered ? '🤝' : mine ? '🎉' : round.winner ? '🦈' : '👋'
  const title = countered ? (
    <Term id="counteroffer">Counteroffer</Term>
  ) : mine ? (
    'It’s a deal!'
  ) : round.winner ? (
    `${sharkName} got it`
  ) : (
    'No deal'
  )
  const detail = countered
    ? `${money(round.counter!.amount, { compact: true })} for ${pct(round.counter!.equity)}?`
    : mine
      ? `You own ${pct(round.winner!.equity)} of ${round.pitch.company.name}.`
      : round.winner
        ? `${money(round.winner.amount, { compact: true })} for ${pct(round.winner.equity)}`
        : 'The founder walked away.'

  return (
    <Card className="animate-scale-in mx-auto max-w-2xl p-8 text-center">
      <p className="text-5xl" aria-hidden>
        {icon}
      </p>
      <h2 className="mt-4 text-[28px] font-bold">{title}</h2>
      <p className="mt-2 text-[17px] text-muted">{detail}</p>
      {mine && round.status === 'closed' && <ValuationQuiz key={`${game.id}-${round.index}`} amount={round.winner!.amount} equity={round.winner!.equity} />}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {countered ? (
          <>
            <Button size="lg" variant="secondary" onClick={() => respondCounter(false)} disabled={busy}>
              No
            </Button>
            <Button size="lg" onClick={() => respondCounter(true)} disabled={busy}>
              Accept
            </Button>
          </>
        ) : game.finished ? (
          <Button size="lg" onClick={showReveal} disabled={busy}>
            See what happened
          </Button>
        ) : (
          <Button size="lg" onClick={next}>
            Next company
          </Button>
        )}
      </div>
    </Card>
  )
}
