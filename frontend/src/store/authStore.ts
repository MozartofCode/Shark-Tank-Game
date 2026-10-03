import { create } from 'zustand'
import { setAccessToken } from '../api/client'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Supabase is loaded on demand so players without accounts never download it. */
let client: SupabaseClient | null = null

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
    if (!url || !key) {
      set({ ready: true })
      return
    }
    const { createClient } = await import('@supabase/supabase-js')
    const sb = (client = createClient(url, key))
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
    const sb = client
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
    await client?.auth.signOut()
    setAccessToken(null)
    set({ email: null, userId: null })
  },
}))
