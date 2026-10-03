// Mirrors the backend response models in backend/app/models/*.py

export type Video =
  | { type: 'file'; path: string }
  | { type: 'youtube'; id: string; start: number; end: number | null }
  | { type: 'url'; url: string }

export interface PublicPitch {
  id: string
  source: { show: string; season: number | null; episode: number | null; channel: string; url: string }
  video: Video
  company: { name: string; category: string; one_liner: string; founders: string[] }
  ask: { amount: number; equity: number }
  implied_valuation: number
  facts: { summary: string; highlights: string[] }
}

export interface SharkPersona {
  id: string
  name: string
  title: string
  avatar: string
  color: string
  bio: string
  thesis: string[]
  style: string
  catchphrase: string
}

export interface SharkReaction {
  shark_id: string
  questions: string[]
  comment: string
  decision: 'in' | 'out'
  offer: { amount: number; equity: number } | null
}

export interface Offer {
  investor: string
  amount: number
  equity: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type Decision = 'pending' | 'accepted' | 'countered' | 'walked'

export interface RoundView {
  index: number
  pitch: PublicPitch
  status: 'open' | 'countered' | 'closed'
  decision: Decision
  questions_left: number
  chat: ChatMessage[]
  shark_reactions: SharkReaction[]
  player_offer: Offer | null
  player_passed: boolean
  counter: Offer | null
  winner: Offer | null
  founder_line: string
}

export interface GameView {
  id: string
  bankroll_start: number
  cash: number
  current_round: number
  total_rounds: number
  finished: boolean
  revealed: boolean
  rounds: RoundView[]
}

export interface Outcome {
  status: 'thriving' | 'acquired' | 'failed'
  years_later: number
  exit_value: number
  value_basis: 'acquisition' | 'estimate' | 'zero'
  retention_factor: number
  headline: string
  story: string
  as_of: string
  sources: string[]
}

export interface DealResult {
  investor: string
  amount: number
  equity: number
  valuation: number
  stake_value: number
  moic: number
}

export interface RevealRound {
  index: number
  pitch: PublicPitch
  outcome: Outcome
  real_deal: { result: 'deal' | 'no_deal'; summary: string }
  deal: DealResult | null
  lessons: { title: string; body: string }[]
}

export interface Standing {
  investor: string
  name: string
  invested: number
  portfolio_value: number
  net_worth: number
  return_pct: number
  deals: number
}

export interface RevealView {
  game_id: string
  bankroll_start: number
  cash_left: number
  invested: number
  portfolio_value: number
  net_worth: number
  return_pct: number
  benchmark_years: number
  benchmark_value: number
  best_deal: string | null
  worst_deal: string | null
  rounds: RevealRound[]
  standings: Standing[]
}

export interface Health {
  status: string
  pitches: number
  ai_founder: boolean
  bankroll: number
}
