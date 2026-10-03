import type { ReactNode } from 'react'
import { TERMS } from '../lib/glossary'
import { useGame } from '../store/gameStore'

/** An inline finance word. Tap it to see what it means. */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const openTerm = useGame((s) => s.openTerm)
  const term = TERMS[id]
  if (!term) return <>{children}</>
  return (
    <button
      type="button"
      onClick={() => openTerm(id)}
      aria-haspopup="dialog"
      aria-label={`${typeof children === 'string' ? children : term.term}: what does this mean?`}
      className="cursor-help underline decoration-faint decoration-dotted underline-offset-4 transition hover:decoration-accent"
    >
      {children ?? term.term}
    </button>
  )
}
