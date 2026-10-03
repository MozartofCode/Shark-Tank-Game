import { useGame } from '../store/gameStore'
import { AccountPanel } from './AccountPanel'
import { Sheet } from './ui'

const WORDS = [
  ['Investment', 'Money you put into a company now, hoping it grows into more money later.'],
  ['Equity', 'Your slice of the company. Owning 10% means one tenth of it is yours.'],
  ['Valuation', 'What the whole company is worth. $100K for 10% means it’s worth $1M.'],
  ['Profit', 'What your slice is worth later, minus what you paid. It can be negative.'],
  ['Exit', 'When investors finally get paid, usually because a bigger company buys it.'],
  ['Diversify', 'Spreading money across many bets so one failure doesn’t wipe you out.'],
]

export function Sheets() {
  const { sheet, openSheet } = useGame()
  const close = () => openSheet(null)

  if (sheet === 'account') {
    return (
      <Sheet title="Your account" onClose={close}>
        <AccountPanel />
      </Sheet>
    )
  }
  if (sheet === 'glossary') {
    return (
      <Sheet title="Money words" onClose={close}>
        <dl className="divide-y divide-line">
          {WORDS.map(([word, meaning]) => (
            <div key={word} className="py-3 first:pt-0 last:pb-0">
              <dt className="font-semibold">{word}</dt>
              <dd className="mt-0.5 text-[15px] leading-relaxed text-muted">{meaning}</dd>
            </div>
          ))}
        </dl>
      </Sheet>
    )
  }
  return null
}
