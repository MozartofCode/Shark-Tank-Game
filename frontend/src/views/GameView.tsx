import { DecisionBanner } from '../components/DecisionBanner'
import { FounderChat } from '../components/FounderChat'
import { OfferSlip } from '../components/OfferSlip'
import { SharkPanel } from '../components/SharkPanel'
import { Button, Card } from '../components/ui'
import { VideoPlayer } from '../components/VideoPlayer'
import { money, pct } from '../lib/format'
import { useGame, type Step } from '../store/gameStore'
import type { RoundView } from '../types'

const STEPS: { key: Step; label: string }[] = [
  { key: 'pitch', label: 'Pitch' },
  { key: 'ask', label: 'Ask' },
  { key: 'invest', label: 'Invest' },
]

export function GameView() {
  const { game, viewIndex, step, setStep, sharks } = useGame()
  if (!game) return null
  const round = game.rounds[viewIndex]
  // Once an offer is made (or skipped), this company stays on the result.
  const decided = round.status !== 'open' || !!round.player_offer || round.player_passed
  const current: Step = decided ? 'invest' : step

  return (
    <main className="mx-auto max-w-5xl px-5 pt-10 pb-6">
      <Header round={round} index={viewIndex} total={game.total_rounds} />

      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-full bg-fill p-1" role="tablist" aria-label="Steps">
          {STEPS.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={current === s.key}
              disabled={decided && s.key !== 'invest'}
              onClick={() => setStep(s.key)}
              className={`h-8 rounded-full px-5 text-[13px] font-medium transition-all duration-300 ${
                current === s.key ? 'bg-surface text-fg shadow-[0_1px_3px_rgb(0_0_0/0.12)]' : 'text-muted hover:text-fg'
              } disabled:opacity-40`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div key={`${round.index}-${current}`} className="animate-fade-up mt-8">
        {current === 'pitch' && (
          <div className="mx-auto max-w-4xl space-y-5">
            <VideoPlayer pitch={round.pitch} />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[13px] text-faint">
                The clip stops before the deal, so no spoilers. Video:{' '}
                <a className="hover:underline" href={round.pitch.source.url} target="_blank" rel="noreferrer">
                  {round.pitch.source.channel}
                </a>
              </p>
              <Button onClick={() => setStep('ask')}>Continue</Button>
            </div>
          </div>
        )}

        {current === 'ask' && (
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-5">
              <FactSheet round={round} />
              <div className="lg:col-span-3">
                <FounderChat round={round} sharks={sharks} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep('invest')}>Continue</Button>
            </div>
          </div>
        )}

        {current === 'invest' && (
          <div className="space-y-5">
            <SharkPanel
              sharks={sharks}
              reactions={round.shark_reactions}
              winner={round.status === 'closed' ? (round.winner?.investor ?? null) : null}
            />
            {decided ? (
              <DecisionBanner game={game} round={round} sharks={sharks} />
            ) : (
              <OfferSlip key={round.index} round={round} cash={game.cash} />
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function Header({ round, index, total }: { round: RoundView; index: number; total: number }) {
  const p = round.pitch
  return (
    <div className="text-center">
      <p className="text-[13px] font-medium text-muted">
        Company {index + 1} of {total}
      </p>
      <h1 className="mt-2 text-[40px] leading-tight font-bold sm:text-[48px]">{p.company.name}</h1>
      <p className="mx-auto mt-2 max-w-2xl text-[17px] text-muted">{p.company.one_liner}</p>
      <p className="mx-auto mt-5 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full bg-surface px-4 py-2 text-[15px] shadow-[var(--shadow-card)]">
        <span>
          Asking <strong>{money(p.ask.amount)}</strong> for <strong>{pct(p.ask.equity)}</strong>
        </span>
        <span className="text-faint">·</span>
        <span className="text-muted">values the company at {money(p.implied_valuation, { compact: true })}</span>
      </p>
    </div>
  )
}

function FactSheet({ round }: { round: RoundView }) {
  const p = round.pitch
  return (
    <Card className="lg:col-span-2">
      <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">Fact sheet</p>
      <p className="mt-3 text-[15px] leading-relaxed">{p.facts.summary}</p>
      <ul className="mt-4 space-y-3">
        {p.facts.highlights.map((h) => (
          <li key={h} className="flex gap-3 text-[15px] leading-snug text-muted">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            {h}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[13px] text-faint">Founded by {p.company.founders.join(' & ')}</p>
    </Card>
  )
}
