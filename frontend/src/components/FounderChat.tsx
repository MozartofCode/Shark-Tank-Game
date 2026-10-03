import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../store/gameStore'
import type { RoundView, SharkPersona } from '../types'

const GENERIC = ['How much have you sold so far?', 'Why is your company worth that much?']

/** iMessage-style chat with the founder. The sharks' questions double as suggestions. */
export function FounderChat({ round, sharks }: { round: RoundView; sharks: SharkPersona[] }) {
  const ask = useGame((s) => s.ask)
  const streaming = useGame((s) => s.streamingAnswer)
  const pending = useGame((s) => s.pendingQuestion)
  const [text, setText] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const founder = round.pitch.company.founders[0]
  const busy = streaming !== null
  const outOfQuestions = round.questions_left === 0

  const suggestions = useMemo(() => {
    const asked = new Set(round.chat.filter((m) => m.role === 'user').map((m) => m.content))
    const fromSharks = round.shark_reactions.flatMap((r) => {
      const shark = sharks.find((s) => s.id === r.shark_id)
      return r.questions.slice(0, 1).map((q) => ({ q, emoji: shark?.avatar ?? '🦈' }))
    })
    return [...fromSharks, ...GENERIC.map((q) => ({ q, emoji: '💬' }))].filter((s) => !asked.has(s.q)).slice(0, 3)
  }, [round.chat, round.shark_reactions, sharks])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [round.chat.length, streaming, pending])

  function submit(q: string) {
    const question = q.trim()
    if (!question || busy || outOfQuestions) return
    setText('')
    void ask(question)
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <p className="text-[15px] font-semibold">{founder}</p>
        </div>
        <p className="text-xs text-muted">
          {round.questions_left} left
        </p>
      </div>

      <div
        ref={scroller}
        className="flex-1 space-y-2 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label={`Conversation with ${founder}`}
      >
        {round.chat.map((m, i) => (
          <Bubble key={i} mine={m.role === 'user'} text={m.content} />
        ))}
        {pending && <Bubble mine text={pending} />}
        {busy && <Bubble mine={false} text={streaming || '•••'} typing={!streaming} />}
      </div>

      {!outOfQuestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {suggestions.map((s) => (
            <button
              key={s.q}
              onClick={() => submit(s.q)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-left text-[13px] text-fg transition hover:bg-fill disabled:opacity-40"
            >
              <span aria-hidden>{s.emoji}</span>
              {s.q}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex items-center gap-2 border-t border-line px-3 py-3"
        onSubmit={(e) => {
          e.preventDefault()
          submit(text)
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          disabled={busy || outOfQuestions}
          placeholder={outOfQuestions ? 'No questions left' : 'Ask a question'}
          className="h-10 min-w-0 flex-1 rounded-full bg-fill px-4 text-[15px] outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={busy || outOfQuestions || !text.trim()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-white transition disabled:bg-fill-strong disabled:text-faint"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M7 12V2M2.5 6.5L7 2l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  )
}

function Bubble({ mine, text, typing = false }: { mine: boolean; text: string; typing?: boolean }) {
  return (
    <div className={`animate-scale-in flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <p
        className={`max-w-[80%] rounded-[20px] px-4 py-2 text-[15px] leading-snug ${
          mine ? 'rounded-br-md bg-accent text-white' : 'rounded-bl-md bg-fill text-fg'
        } ${typing ? 'animate-pulse tracking-widest text-muted' : ''}`}
      >
        {text}
      </p>
    </div>
  )
}
