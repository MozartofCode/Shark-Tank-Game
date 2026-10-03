import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'plain'
type Size = 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98]',
  secondary: 'bg-fill text-fg hover:bg-fill-strong active:scale-[0.98]',
  plain: 'text-accent hover:underline underline-offset-4',
}

const SIZES: Record<Size, string> = {
  md: 'h-10 px-5 text-[15px]',
  lg: 'h-12 px-7 text-[17px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const shape = variant === 'plain' ? 'text-[15px]' : `rounded-full ${SIZES[size]}`
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition duration-200 disabled:pointer-events-none disabled:opacity-40 ${shape} ${VARIANTS[variant]} ${className}`}
    />
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-surface p-6 shadow-[var(--shadow-card)] ${className}`}>{children}</div>
}

type Tone = 'neutral' | 'win' | 'loss' | 'accent'

const TONES: Record<Tone, string> = {
  neutral: 'bg-fill text-muted',
  win: 'bg-win/12 text-win',
  loss: 'bg-loss/12 text-loss',
  accent: 'bg-accent/12 text-accent',
}

export function Pill({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function Avatar({ emoji, color, size = 40 }: { emoji: string; color: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, fontSize: size * 0.5, background: `${color}1f` }}
    >
      {emoji}
    </span>
  )
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Centered modal sheet with a dimmed backdrop. Closes on Escape or backdrop click,
 * keeps keyboard focus inside while open, and returns focus where it was.
 */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  }, [onClose])

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const focusables = () => [...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
    ;(focusables().find((el) => el.tagName === 'INPUT') ?? focusables()[0])?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current()
      if (e.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      opener?.focus?.()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="animate-fade-in absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        className="animate-sheet-up relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-[var(--shadow-float)] sm:max-w-md sm:rounded-3xl sm:p-8"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id={titleId} className="text-xl font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full bg-fill text-muted transition hover:bg-fill-strong"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
