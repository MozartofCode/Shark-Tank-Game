import { money, pct } from '../lib/format'
import { useGame } from '../store/gameStore'
import type { GameView, RoundView, SharkPersona } from '../types'
import { Button } from './ui'

export function DecisionBanner({ game, round, sharks }: { game: GameView; round: RoundView; sharks: SharkPersona[] }) {
  const { respondCounter, next, showReveal, busy } = useGame()
  const founder = round.pitch.company.founders.join(' & ')
  const winnerName =
    round.winner?.investor === 'player' ? 'You' : sharks.find((s) => s.id === round.winner?.investor)?.name

  return (
    <div className="animate-rise rounded-2xl border border-line bg-panel/90 p-5">
      <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">{founder} says</p>
      <p className="mt-2 text-lg leading-snug">“{round.founder_line}”</p>

      {round.status === 'countered' && round.counter && (
        <div className="mt-4 rounded-xl border border-gold/50 bg-gold/5 p-4">
          <p className="text-sm">
            Counter-offer: <strong>{money(round.counter.amount)}</strong> for <strong>{pct(round.counter.equity)}</strong>
          </p>
          <div className="mt-3 flex gap-3">
            <Button onClick={() => respondCounter(true)} disabled={busy}>
              Accept counter
            </Button>
            <Button variant="ghost" onClick={() => respondCounter(false)} disabled={busy}>
              Walk away
            </Button>
          </div>
        </div>
      )}

      {round.status === 'closed' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className={`text-sm font-semibold ${round.winner?.investor === 'player' ? 'text-win' : 'text-muted'}`}>
            {round.winner
              ? `${winnerName} invested ${money(round.winner.amount)} for ${pct(round.winner.equity)}.`
              : 'No deal. The founder walks away.'}
          </p>
          {game.finished ? (
            <Button onClick={showReveal} disabled={busy}>
              Fast-forward: see what happened →
            </Button>
          ) : (
            <Button onClick={next}>Next pitch →</Button>
          )}
        </div>
      )}
    </div>
  )
}
