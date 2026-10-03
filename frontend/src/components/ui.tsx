import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'gold' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  gold: 'bg-gold text-ink hover:bg-[#ffcb5c] shadow-[0_0_24px_rgb(245_185_66/0.35)]',
  ghost: 'border border-line bg-panel-2/60 text-[#e6ecf7] hover:border-sea/60 hover:bg-panel-2',
  danger: 'border border-loss/40 bg-loss/10 text-loss hover:bg-loss/20',
}

export function Button({
  variant = 'gold',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-panel/80 p-5 backdrop-blur ${className}`}>
      {children}
    </div>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold tracking-[0.18em] text-sea uppercase">{children}</p>
}

export function Learn({ term, children }: { term: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex cursor-help items-center">
      <span className="border-b border-dotted border-muted">{term}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg border border-line bg-stage p-3 text-xs leading-relaxed font-normal text-[#cdd6e8] opacity-0 shadow-xl transition group-hover:opacity-100"
      >
        {children}
      </span>
    </span>
  )
}
