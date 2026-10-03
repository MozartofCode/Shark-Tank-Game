import { money, pct } from '../lib/format'
import { useGame } from '../store/gameStore'
import type { GameView, RoundView, SharkPersona } from '../types'
import { Button } from './ui'

export function DecisionBanner({ game, round, sharks }: { game: GameView; round: RoundView; sharks: SharkPersona[] }) {
  const { respondCounter, next, showReveal, busy } = useGame()
  const company = round.pitch.company.name
  const founder = round.pitch.company.founders.join(' & ')
  const mine = round.winner?.investor === 'player'
  const sharkName = sharks.find((s) => s.id === round.winner?.investor)?.name

  let headline: string
  if (round.status === 'countered') headline = 'The founder wants a better deal'
  else if (mine) headline = `🎉 Deal! You now own ${pct(round.winner!.equity)} of ${company}.`
  else if (round.winner) headline = `${sharkName} got the deal.`
  else headline = 'No deal.'

  return (
    <div className="animate-rise rounded-2xl border border-line bg-panel/90 p-5">
      <p className={`text-xl font-bold ${mine ? 'text-win' : ''}`}>{headline}</p>
      <p className="mt-2 text-[#c3cde0]">
        {founder}: “{round.founder_line}”
      </p>

      {round.status === 'countered' && round.counter && (
        <div className="mt-4 rounded-xl border border-gold/50 bg-gold/5 p-4">
          <p>
            They'll take <strong>{money(round.counter.amount)}</strong> for <strong>{pct(round.counter.equity)}</strong>{' '}
            instead. Do you accept?
          </p>
          <div className="mt-3 flex gap-3">
            <Button onClick={() => respondCounter(true)} disabled={busy}>
              Yes, deal!
            </Button>
            <Button variant="ghost" onClick={() => respondCounter(false)} disabled={busy}>
              No thanks
            </Button>
          </div>
        </div>
      )}

      {round.status === 'closed' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {mine
              ? `You paid ${money(round.winner!.amount)}. Will it grow? You'll find out at the end of the day.`
              : round.winner
                ? `${sharkName} paid ${money(round.winner.amount)} for ${pct(round.winner.equity)}.`
                : 'Nobody invested in this company today.'}
          </p>
          {game.finished ? (
            <Button onClick={showReveal} disabled={busy}>
              See what happened →
            </Button>
          ) : (
            <Button onClick={next}>Next company →</Button>
          )}
        </div>
      )}
    </div>
  )
}
