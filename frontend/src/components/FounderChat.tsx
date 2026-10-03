import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store/gameStore'
import type { RoundView } from '../types'
import { Button } from './ui'

const SUGGESTIONS = [
  'How much have you sold so far?',
  'Why is your company worth that much?',
  'What will you do with the money?',
  'What if a big company copies you?',
]

export function FounderChat({ round }: { round: RoundView }) {
  const ask = useGame((s) => s.ask)
  const streaming = useGame((s) => s.streamingAnswer)
  const pending = useGame((s) => s.pendingQuestion)
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const founder = round.pitch.company.founders.join(' & ')
  const disabled = streaming !== null || round.questions_left === 0

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [round.chat.length, streaming])

  function submit(q: string) {
    const question = q.trim()
    if (!question || disabled) return
    setText('')
    void ask(question)
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-panel/80">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Ask the founder</p>
          <p className="text-xs text-muted">{founder}</p>
        </div>
        <span className="rounded-full bg-panel-2 px-2.5 py-1 text-xs text-muted">
          {round.questions_left} of 3 questions left
        </span>
      </div>

      <div className="max-h-80 min-h-40 flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {round.chat.length === 0 && streaming === null && (
          <p className="text-muted">
            Good investors ask questions first. Tap a suggestion or type your own.
          </p>
        )}
        {round.chat.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.content} />
        ))}
        {pending && <Bubble role="user" text={pending} />}
        {streaming !== null && <Bubble role="assistant" text={streaming || '…'} />}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line p-3">
        {round.chat.length === 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                disabled={disabled}
                className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-sea/60 hover:text-[#e6ecf7] disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit(text)
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            disabled={disabled}
            placeholder={round.questions_left ? 'Ask the founder anything…' : 'No questions left'}
            className="min-w-0 flex-1 rounded-xl border border-line bg-stage px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-sea"
          />
          <Button type="submit" variant="ghost" disabled={disabled || !text.trim()}>
            Ask
          </Button>
        </form>
      </div>
    </div>
  )
}

function Bubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const mine = role === 'user'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <p
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed ${
          mine ? 'rounded-br-sm bg-sea/20 text-[#dff3ff]' : 'rounded-bl-sm bg-panel-2 text-[#e6ecf7]'
        }`}
      >
        {text}
      </p>
    </div>
  )
}
