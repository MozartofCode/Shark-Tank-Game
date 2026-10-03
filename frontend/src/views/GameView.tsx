import { DecisionBanner } from '../components/DecisionBanner'
import { FounderChat } from '../components/FounderChat'
import { OfferSlip } from '../components/OfferSlip'
import { SharkPanel } from '../components/SharkPanel'
import { Button, Card, Learn } from '../components/ui'
import { VideoPlayer } from '../components/VideoPlayer'
import { money, pct } from '../lib/format'
import { useGame, type Step } from '../store/gameStore'
import type { RoundView } from '../types'

const STEPS: { key: Step; label: string }[] = [
  { key: 'intro', label: '1 Meet' },
  { key: 'video', label: '2 Watch' },
  { key: 'qa', label: '3 Ask' },
  { key: 'offers', label: '4 Invest' },
]

export function GameView() {
  const { game, viewIndex, step, setStep, sharks } = useGame()
  if (!game) return null
  const round = game.rounds[viewIndex]
  // Once an offer is made (or skipped), this company always shows the result.
  const decided = round.status !== 'open' || round.player_offer || round.player_passed
  const current = decided ? 'offers' : step

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">{round.pitch.company.name}</h2>
          <p className="mt-1 text-[#c3cde0]">{round.pitch.company.one_liner}</p>
        </div>
        <ol className="flex gap-1 text-xs" aria-label="Steps">
          {STEPS.map((s, i) => {
            const idx = STEPS.findIndex((x) => x.key === current)
            return (
              <li
                key={s.key}
                className={`rounded-full px-3 py-1 ${
                  i === idx ? 'bg-gold font-semibold text-ink' : i < idx ? 'bg-panel-2 text-[#cdd6e8]' : 'text-muted'
                }`}
              >
                {s.label}
              </li>
            )
          })}
        </ol>
      </div>

      {current === 'intro' && <Intro round={round} onNext={() => setStep('video')} />}

      {current === 'video' && (
        <div className="space-y-4">
          <VideoPlayer pitch={round.pitch} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              The clip stops before the sharks make their offers. No spoilers!{' '}
              <a className="underline hover:text-[#e6ecf7]" href={round.pitch.source.url} target="_blank" rel="noreferrer">
                Video: {round.pitch.source.channel}
              </a>
            </p>
            <Button onClick={() => setStep('qa')}>Next: ask questions →</Button>
          </div>
        </div>
      )}

      {current === 'qa' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <FactSheet round={round} />
            </div>
            <div className="lg:col-span-3">
              <FounderChat round={round} />
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-muted">What the sharks want to know</p>
            <SharkPanel sharks={sharks} reactions={round.shark_reactions} mode="questions" />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep('offers')}>Next: decide to invest →</Button>
          </div>
        </div>
      )}

      {current === 'offers' && (
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-semibold text-muted">The sharks decide</p>
            <SharkPanel
              sharks={sharks}
              reactions={round.shark_reactions}
              mode="offers"
              winner={round.status === 'closed' ? (round.winner?.investor ?? null) : null}
            />
          </div>
          {decided ? (
            <DecisionBanner game={game} round={round} sharks={sharks} />
          ) : (
            <OfferSlip key={round.index} round={round} cash={game.cash} />
          )}
        </div>
      )}
    </main>
  )
}

function Intro({ round, onNext }: { round: RoundView; onNext: () => void }) {
  const p = round.pitch
  const who = p.company.founders.join(' & ')
  return (
    <Card className="animate-rise mx-auto max-w-2xl p-8 text-center">
      <p className="text-lg leading-relaxed">
        <strong>{who}</strong> {p.company.founders.length > 1 ? 'want' : 'wants'}{' '}
        <strong className="text-gold">{money(p.ask.amount)}</strong> for{' '}
        <strong className="text-gold">{pct(p.ask.equity)}</strong> of the company.
      </p>
      <p className="mt-3 text-[#c3cde0]">
        That means they think the whole company is worth{' '}
        <Learn term={money(p.implied_valuation, { compact: true })}>
          {money(p.ask.amount)} ÷ {pct(p.ask.equity)} = {money(p.implied_valuation)}. This is called the company's
          valuation.
        </Learn>
        .
      </p>
      <Button onClick={onNext} className="mt-8 px-8 py-3 text-base">
        ▶ Watch the pitch
      </Button>
    </Card>
  )
}

function FactSheet({ round }: { round: RoundView }) {
  const p = round.pitch
  return (
    <Card>
      <p className="font-semibold">Quick facts</p>
      <p className="mt-2 text-sm text-[#c3cde0]">{p.facts.summary}</p>
      <ul className="mt-3 space-y-2 text-sm text-[#c3cde0]">
        {p.facts.highlights.map((h) => (
          <li key={h} className="flex gap-2">
            <span className="text-gold">•</span>
            {h}
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-stage/70 px-3 py-2 text-sm">
        They want <strong>{money(p.ask.amount)}</strong> for <strong>{pct(p.ask.equity)}</strong> (company value{' '}
        {money(p.implied_valuation, { compact: true })})
      </p>
    </Card>
  )
}
