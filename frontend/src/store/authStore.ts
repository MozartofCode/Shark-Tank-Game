import { create } from 'zustand'
import { setAccessToken } from '../api/client'
import { initSupabase, supabase } from '../lib/supabase'

interface AuthState {
  enabled: boolean
  ready: boolean
  email: string | null
  userId: string | null
  linkSentTo: string | null
  error: string | null

  init: (url: string | null, key: string | null, onSignedIn: () => void) => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  enabled: false,
  ready: false,
  email: null,
  userId: null,
  linkSentTo: null,
  error: null,

  async init(url, key, onSignedIn) {
    const sb = initSupabase(url, key)
    if (!sb) {
      set({ ready: true })
      return
    }
    const { data } = await sb.auth.getSession()
    const session = data.session
    setAccessToken(session?.access_token ?? null)
    set({ enabled: true, ready: true, email: session?.user.email ?? null, userId: session?.user.id ?? null })

    sb.auth.onAuthStateChange((event, s) => {
      setAccessToken(s?.access_token ?? null)
      set({ email: s?.user.email ?? null, userId: s?.user.id ?? null })
      if (event === 'SIGNED_IN') {
        set({ linkSentTo: null })
        onSignedIn()
      }
    })
  },

  async sendMagicLink(email) {
    const sb = supabase()
    if (!sb) return
    set({ error: null })
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) set({ error: error.message })
    else set({ linkSentTo: email })
  },

  async signOut() {
    await supabase()?.auth.signOut()
    setAccessToken(null)
    set({ email: null, userId: null })
  },
}))
