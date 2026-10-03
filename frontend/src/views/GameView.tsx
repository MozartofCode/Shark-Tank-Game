import type { ReactNode } from 'react'
import { DecisionBanner } from '../components/DecisionBanner'
import { FounderChat } from '../components/FounderChat'
import { OfferSlip } from '../components/OfferSlip'
import { SharkPanel } from '../components/SharkPanel'
import { Button, Card, Eyebrow, Learn } from '../components/ui'
import { VideoPlayer } from '../components/VideoPlayer'
import { money, pct } from '../lib/format'
import { useGame } from '../store/gameStore'
import type { RoundView } from '../types'

export function GameView() {
  const { game, viewIndex, step, setStep, sharks } = useGame()
  if (!game) return null
  const round = game.rounds[viewIndex]
  // A round that has offers or a decision always shows the offers stage.
  const decided = round.status !== 'open' || round.player_offer || round.player_passed
  const current = decided ? 'offers' : step

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>
            Pitch {viewIndex + 1} of {game.total_rounds}
          </Eyebrow>
          <h2 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">{round.pitch.company.name}</h2>
        </div>
        <StepTabs current={current} />
      </div>

      {current === 'intro' && <Intro round={round} onNext={() => setStep('video')} />}

      {current === 'video' && (
        <div className="space-y-4">
          <VideoPlayer pitch={round.pitch} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Clip: <a className="underline hover:text-[#e6ecf7]" href={round.pitch.source.url} target="_blank" rel="noreferrer">
                {round.pitch.source.channel}
              </a>
              . The clip stops before the deal is made; no spoilers.
            </p>
            <Button onClick={() => setStep('qa')}>On to questions →</Button>
          </div>
        </div>
      )}

      {current === 'qa' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-2">
              <FactSheet round={round} />
            </div>
            <div className="lg:col-span-3">
              <FounderChat round={round} />
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-muted">What the other sharks are asking</p>
            <SharkPanel sharks={sharks} reactions={round.shark_reactions} mode="questions" />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep('offers')}>Time for offers →</Button>
          </div>
        </div>
      )}

      {current === 'offers' && (
        <div className="space-y-6">
          <SharkPanel
            sharks={sharks}
            reactions={round.shark_reactions}
            mode="offers"
            winner={round.status === 'closed' ? (round.winner?.investor ?? null) : null}
          />
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

const STEP_LABELS = [
  ['intro', 'Intro'],
  ['video', 'Pitch'],
  ['qa', 'Q&A'],
  ['offers', 'Offers'],
] as const

function StepTabs({ current }: { current: string }) {
  const idx = STEP_LABELS.findIndex(([k]) => k === current)
  return (
    <ol className="flex gap-1 text-xs">
      {STEP_LABELS.map(([k, label], i) => (
        <li
          key={k}
          className={`rounded-full px-3 py-1 ${
            i === idx ? 'bg-gold text-ink font-semibold' : i < idx ? 'bg-panel-2 text-[#cdd6e8]' : 'text-muted'
          }`}
        >
          {label}
        </li>
      ))}
    </ol>
  )
}

function Intro({ round, onNext }: { round: RoundView; onNext: () => void }) {
  const p = round.pitch
  return (
    <Card className="animate-rise mx-auto max-w-2xl p-8 text-center">
      <p className="text-sm text-muted">
        {p.company.founders.join(' & ')} {p.company.founders.length > 1 ? 'are' : 'is'} entering the tank
      </p>
      <p className="mt-4 text-xl text-[#e6ecf7]">{p.company.one_liner}</p>
      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat label="Asking for" value={money(p.ask.amount, { compact: true })} />
        <Stat label="For equity" value={pct(p.ask.equity)} />
        <Stat
          label={
            <Learn term="Implied valuation">
              The ask divided by the equity offered: what the founder thinks the whole company is worth.
            </Learn>
          }
          value={money(p.implied_valuation, { compact: true })}
          highlight
        />
      </div>
      <Button onClick={onNext} className="mt-8 px-8 py-3 text-base">
        ▶ Roll the tape
      </Button>
    </Card>
  )
}

function Stat({ label, value, highlight }: { label: ReactNode; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-stage/70 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${highlight ? 'text-gold' : ''}`}>{value}</p>
    </div>
  )
}

function FactSheet({ round }: { round: RoundView }) {
  const p = round.pitch
  return (
    <Card>
      <p className="text-sm font-semibold">Fact sheet</p>
      <p className="mt-2 text-sm text-[#c3cde0]">{p.facts.summary}</p>
      <ul className="mt-3 space-y-2 text-sm text-[#c3cde0]">
        {p.facts.highlights.map((h) => (
          <li key={h} className="flex gap-2">
            <span className="text-gold">•</span>
            {h}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between rounded-xl bg-stage/70 px-3 py-2 text-sm">
        <span className="text-muted">The ask</span>
        <span className="font-semibold">
          {money(p.ask.amount)} for {pct(p.ask.equity)} → {money(p.implied_valuation, { compact: true })}
        </span>
      </div>
    </Card>
  )
}
