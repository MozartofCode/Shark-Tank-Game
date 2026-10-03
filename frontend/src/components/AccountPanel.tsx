import { useState } from 'react'
import { useAuth } from '../store/authStore'
import { Button } from './ui'

/** Magic-link sign-in. Renders nothing when accounts aren't configured. */
export function AccountPanel() {
  const { enabled, email, linkSentTo, error, sendMagicLink, signOut } = useAuth()
  const [value, setValue] = useState('')
  const [oldEnough, setOldEnough] = useState(false)
  if (!enabled) return null

  if (email) {
    return (
      <div className="space-y-4">
        <p className="text-[15px] text-muted">{email}</p>
        <Button variant="secondary" onClick={signOut} className="w-full">
          Sign out
        </Button>
      </div>
    )
  }

  if (linkSentTo) {
    return (
      <div className="space-y-2 text-center">
        <p className="text-3xl">✉️</p>
        <p className="font-medium">Check your email</p>
        <p className="text-[15px] text-muted">Tap the link we sent to {linkSentTo}.</p>
      </div>
    )
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (value.includes('@') && oldEnough) void sendMagicLink(value.trim())
      }}
    >
      <p className="text-[15px] text-muted">Save your portfolio and join the leaderboard.</p>
      <input
        type="email"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Email address"
        aria-label="Email address"
        className="h-12 w-full rounded-xl bg-fill px-4 text-[17px] outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/50"
      />
      <label className="flex items-center gap-3 text-[15px]">
        <input
          type="checkbox"
          required
          checked={oldEnough}
          onChange={(e) => setOldEnough(e.target.checked)}
          className="h-5 w-5 accent-[var(--color-accent)]"
        />
        I’m 13 or older
      </label>
      <Button type="submit" size="lg" className="w-full" disabled={!oldEnough}>
        Continue
      </Button>
      {error && <p className="text-sm text-loss">{error}</p>}
    </form>
  )
}
