import { create } from 'zustand'
import { api, ApiError } from '../api/client'
import { loadLocalPortfolio, saveDayLocally } from '../lib/portfolio'
import type { GameView, Health, PortfolioDay, RevealView, SharkPersona } from '../types'
import { useAuth } from './authStore'

/** Client-side steps within one pitch. The server only tracks offers/decisions. */
export type Step = 'pitch' | 'ask' | 'invest'
export type Screen = 'home' | 'game' | 'reveal' | 'portfolio' | 'learn' | 'privacy' | 'terms'
export type SheetName = 'account' | null

const GAME_KEY = 'tankday.gameId'

function remember(id: string | null) {
  try {
    if (id) localStorage.setItem(GAME_KEY, id)
    else localStorage.removeItem(GAME_KEY)
  } catch {
    /* storage unavailable: resume just won't work */
  }
}

function recall(): string | null {
  try {
    return localStorage.getItem(GAME_KEY)
  } catch {
    return null
  }
}

interface State {
  screen: Screen
  health: Health | null
  sharks: SharkPersona[]
  game: GameView | null
  reveal: RevealView | null
  viewIndex: number
  step: Step
  busy: boolean
  error: string | null
  streamingAnswer: string | null
  pendingQuestion: string | null
  portfolio: PortfolioDay[]
  sheet: SheetName
  term: string | null
  returnTo: Screen

  boot: () => Promise<void>
  start: (mode?: 'random' | 'daily') => Promise<void>
  claimCurrent: () => Promise<void>
  setStep: (step: Step) => void
  ask: (question: string) => Promise<void>
  offer: (amount: number, equity: number, reason: string | null) => Promise<void>
  pass: () => Promise<void>
  respondCounter: (accept: boolean) => Promise<void>
  next: () => void
  showReveal: () => Promise<void>
  loadPortfolio: () => Promise<void>
  openPortfolio: () => void
  goHome: () => void
  clearError: () => void
  openSheet: (sheet: SheetName) => void
  openTerm: (id: string | null) => void
  openLearn: () => void
  openPage: (screen: Screen) => void
  back: () => void
}

export const useGame = create<State>((set, get) => {
  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    set({ busy: true, error: null })
    try {
      return await fn()
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Something went wrong.' })
      return undefined
    } finally {
      set({ busy: false })
    }
  }

  return {
    screen: 'home',
    health: null,
    sharks: [],
    game: null,
    reveal: null,
    viewIndex: 0,
    step: 'pitch',
    busy: false,
    error: null,
    streamingAnswer: null,
    pendingQuestion: null,
    portfolio: loadLocalPortfolio(),
    sheet: null,
    term: null,
    returnTo: 'home',

    async boot() {
      await run(async () => {
        const [health, sharks, config] = await Promise.all([api.health(), api.sharks(), api.config()])
        set({ health, sharks })
        // Restore the session first so owned games load with the right token.
        await useAuth
          .getState()
          .init(config.supabase_url, config.supabase_publishable_key, () => void get().claimCurrent())
      })
      void get().loadPortfolio()
      const id = recall()
      if (!id) return
      try {
        const game = await api.getGame(id)
        set({ game, viewIndex: Math.min(game.current_round, game.total_rounds - 1) })
      } catch (e) {
        if (e instanceof ApiError && (e.status === 404 || e.status === 403)) remember(null)
      }
    },

    async start(mode = 'random') {
      const game = await run(() => api.newGame(mode))
      if (!game) return
      remember(game.id)
      set({ game, reveal: null, viewIndex: 0, step: 'pitch', screen: 'game' })
      window.scrollTo({ top: 0 })
    },

    /** After signing in, attach the current guest game to the account (saves it if finished). */
    async claimCurrent() {
      const { game, reveal } = get()
      void get().loadPortfolio()
      if (!game || game.signed_in) return
      try {
        const claimed = await api.claim(game.id)
        set({ game: claimed })
        if (reveal) set({ reveal: await api.reveal(game.id) })
        void get().loadPortfolio()
      } catch {
        /* someone else's game or expired: leave as is */
      }
    },

    setStep: (step) => {
      set({ step })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    async ask(question) {
      const { game, viewIndex } = get()
      if (!game) return
      set({ streamingAnswer: '', pendingQuestion: question, error: null })
      try {
        await api.ask(game.id, viewIndex, question, (t) =>
          set((s) => ({ streamingAnswer: (s.streamingAnswer ?? '') + t })),
        )
        set({ game: await api.getGame(game.id) })
      } catch (e) {
        set({ error: e instanceof Error ? e.message : 'The founder lost their train of thought.' })
      } finally {
        set({ streamingAnswer: null, pendingQuestion: null })
      }
    },

    async offer(amount, equity, reason) {
      const { game, viewIndex } = get()
      if (!game) return
      const updated = await run(() => api.offer(game.id, viewIndex, amount, equity, reason))
      if (updated) set({ game: updated })
    },

    async pass() {
      const { game, viewIndex } = get()
      if (!game) return
      const updated = await run(() => api.pass(game.id, viewIndex))
      if (updated) set({ game: updated })
    },

    async respondCounter(accept) {
      const { game, viewIndex } = get()
      if (!game) return
      const updated = await run(() => api.counter(game.id, viewIndex, accept))
      if (updated) set({ game: updated })
    },

    next() {
      const { game } = get()
      if (!game) return
      set({ viewIndex: Math.min(game.current_round, game.total_rounds - 1), step: 'pitch' })
      window.scrollTo({ top: 0 })
    },

    async showReveal() {
      const { game } = get()
      if (!game) return
      const reveal = await run(() => api.reveal(game.id))
      if (!reveal) return
      saveDayLocally(reveal)
      set({ reveal, screen: 'reveal' })
      window.scrollTo({ top: 0 })
      void get().loadPortfolio()
    },

    /** Signed-in players with saved runs get their server portfolio; everyone else, this browser's. */
    async loadPortfolio() {
      const local = loadLocalPortfolio()
      const { health } = get()
      if (useAuth.getState().userId && health?.leaderboards) {
        try {
          const server = await api.myPortfolio()
          set({ portfolio: server.length ? server : local })
          return
        } catch {
          /* fall back to local */
        }
      }
      set({ portfolio: local })
    },

    openPortfolio() {
      void get().loadPortfolio()
      set({ screen: 'portfolio' })
      window.scrollTo({ top: 0 })
    },

    /** Back to the home screen; an unfinished day can be continued from there. */
    goHome() {
      set({ screen: 'home', step: 'pitch' })
      window.scrollTo({ top: 0 })
    },

    clearError: () => set({ error: null }),
    openSheet: (sheet) => set({ sheet }),
    openTerm: (term) => set({ term }),

    /** The glossary page; remembers where you came from so "Back" returns there. */
    openLearn() {
      const { screen } = get()
      set({ screen: 'learn', term: null, returnTo: screen === 'learn' ? 'home' : screen })
      window.scrollTo({ top: 0 })
    },

    openPage(screen) {
      set({ screen })
      window.scrollTo({ top: 0 })
    },

    back() {
      set({ screen: get().returnTo })
      window.scrollTo({ top: 0 })
    },
  }
})

/** Resume an in-progress game from the home screen. */
export function resumeGame() {
  const { game } = useGame.getState()
  if (!game) return
  if (game.finished) void useGame.getState().showReveal()
  else useGame.setState({ screen: 'game', step: 'pitch', viewIndex: Math.min(game.current_round, game.total_rounds - 1) })
}
