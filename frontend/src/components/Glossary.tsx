import { Card } from './ui'

const WORDS = [
  {
    word: 'Investment',
    meaning: 'Money you give a company now, hoping it grows into more money later.',
  },
  {
    word: 'Ownership (equity)',
    meaning: 'The slice of the company you get for your money. 10% means you own one tenth of it.',
  },
  {
    word: 'Company value (valuation)',
    meaning: 'What the whole company is worth. $100K for 10% means the company is worth $1M.',
  },
  {
    word: 'Profit',
    meaning: 'What your slice is worth later minus what you paid. It can be negative!',
  },
]

export function Glossary() {
  return (
    <Card>
      <p className="font-semibold">Money words in 30 seconds</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {WORDS.map((w) => (
          <div key={w.word} className="rounded-xl bg-stage/70 p-3">
            <dt className="text-sm font-semibold text-gold">{w.word}</dt>
            <dd className="mt-1 text-sm text-[#c3cde0]">{w.meaning}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
