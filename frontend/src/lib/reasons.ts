export type Reason = 'team' | 'product' | 'price' | 'gut'

export const REASONS: { id: Reason; label: string; emoji: string }[] = [
  { id: 'team', label: 'Team', emoji: '🧑‍🤝‍🧑' },
  { id: 'product', label: 'Product', emoji: '📦' },
  { id: 'price', label: 'Price', emoji: '🏷️' },
  { id: 'gut', label: 'Gut feeling', emoji: '✨' },
]

export const REASON_LABEL: Record<Reason, string> = Object.fromEntries(
  REASONS.map((r) => [r.id, `${r.emoji} ${r.label}`]),
) as Record<Reason, string>
