import { money, pct } from '../lib/format'
import { useGame } from '../store/gameStore'
import type { GameView, RoundView, SharkPersona } from '../types'
import { Button, Card } from './ui'

/** What the founder decided: deal, counter-offer, or no deal. */
export function DecisionBanner({ game, round, sharks }: { game: GameView; round: RoundView; sharks: SharkPersona[] }) {
  const { respondCounter, next, showReveal, busy } = useGame()
  const company = round.pitch.company.name
  const founder = round.pitch.company.founders[0]
  const mine = round.winner?.investor === 'player'
  const sharkName = sharks.find((s) => s.id === round.winner?.investor)?.name

  const countered = round.status === 'countered' && round.counter
  const icon = countered ? '🤝' : mine ? '🎉' : round.winner ? '🦈' : '👋'
  const title = countered
    ? 'They want a better deal'
    : mine
      ? 'It’s a deal!'
      : round.winner
        ? `${sharkName} got the deal`
        : 'No deal'
  const detail = countered
    ? `${money(round.counter!.amount)} for ${pct(round.counter!.equity)} instead of your offer.`
    : mine
      ? `You now own ${pct(round.winner!.equity)} of ${company} for ${money(round.winner!.amount)}.`
      : round.winner
        ? `${money(round.winner.amount)} for ${pct(round.winner.equity)}. You keep your money.`
        : 'Nobody invested in this one.'

  return (
    <Card className="animate-scale-in mx-auto max-w-2xl p-8 text-center">
      <p className="text-5xl" aria-hidden>
        {icon}
      </p>
      <h2 className="mt-4 text-[28px] font-bold">{title}</h2>
      <p className="mt-2 text-[17px] text-muted">{detail}</p>
      <p className="mx-auto mt-5 max-w-md text-[15px] text-faint italic">
        {founder}: “{round.founder_line}”
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {countered ? (
          <>
            <Button size="lg" variant="secondary" onClick={() => respondCounter(false)} disabled={busy}>
              No thanks
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
      {!countered && game.finished && (
        <p className="mt-3 text-[13px] text-faint">That was the last company. Time to find out how you did.</p>
      )}
    </Card>
  )
}
