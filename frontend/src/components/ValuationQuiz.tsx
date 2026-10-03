import { useMemo, useState } from 'react'
import { money, pct } from '../lib/format'
import { recordQuiz } from '../lib/progress'
import { Term } from './Term'

/** One-tap check after a deal: can you work out the valuation you just agreed to? */
export function ValuationQuiz({ amount, equity }: { amount: number; equity: number }) {
  const [picked, setPicked] = useState<number | null>(null)
  const correct = Math.round(amount / equity)

  const options = useMemo(() => {
    const wrong = [amount, correct * 2, Math.round(correct / 2), Math.round(amount * (1 + equity))]
    const unique = [...new Set([correct, ...wrong.filter((w) => w !== correct)])].slice(0, 3)
    // Stable shuffle so the right answer isn't always first.
    return unique.sort((a, b) => ((a * 7919) % 97) - ((b * 7919) % 97))
  }, [amount, equity, correct])

  return (
    <div className="mt-6 rounded-2xl bg-fill px-5 py-4 text-left">
      <p className="text-[15px] font-medium">
        Quick check: what <Term id="valuation">valuation</Term> did you just agree to?
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {options.map((o) => {
          const isPicked = picked === o
          const reveal = picked !== null
          const tone = !reveal
            ? 'bg-surface hover:bg-fill-strong'
            : o === correct
              ? 'bg-win/15 text-win'
              : isPicked
                ? 'bg-loss/15 text-loss'
                : 'bg-surface opacity-50'
          return (
            <button
              key={o}
              disabled={reveal}
              onClick={() => {
                setPicked(o)
                recordQuiz(o === correct)
              }}
              className={`h-11 rounded-xl text-[15px] font-semibold tabular-nums transition ${tone}`}
            >
              {money(o, { compact: true })}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <p className="mt-3 text-[13px] text-muted">
          {picked === correct ? '✓ Right! ' : 'Not quite. '}
          {money(amount, { compact: true })} ÷ {pct(equity)} = {money(correct, { compact: true })}
        </p>
      )}
    </div>
  )
}
