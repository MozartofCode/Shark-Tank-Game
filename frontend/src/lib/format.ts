export function money(n: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact || Math.abs(n) >= 1_000_000) {
    const abs = Math.abs(n)
    const sign = n < 0 ? '-' : ''
    if (abs >= 1e9) return `${sign}$${trim(abs / 1e9)}B`
    if (abs >= 1e6) return `${sign}$${trim(abs / 1e6)}M`
    if (abs >= 1e3) return `${sign}$${trim(abs / 1e3)}K`
  }
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function trim(x: number): string {
  return x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1).replace(/\.0$/, '') : x.toFixed(2).replace(/\.?0+$/, '')
}

export function pct(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits).replace(/\.0$/, '')}%`
}

export function valuation(amount: number, equity: number): number {
  return equity > 0 ? Math.round(amount / equity) : 0
}

export function signedPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

/** Text color for a gain, a loss, or nothing. */
export function profitTone(n: number): string {
  return n > 0 ? 'text-win' : n < 0 ? 'text-loss' : 'text-muted'
}

/** "+$1.2M" / "-$50,000" (compact shortens big numbers). */
export function signedMoney(n: number, compact = false): string {
  const s = money(Math.abs(n), { compact })
  return `${n > 0 ? '+' : n < 0 ? '-' : ''}${s}`
}
