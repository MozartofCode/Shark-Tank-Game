import { useState } from 'react'
import { useAuth } from '../store/authStore'
import { Button } from './ui'

/** Magic-link sign-in. Renders nothing when accounts aren't configured. */
export function AccountPanel() {
  const { enabled, email, linkSentTo, error, sendMagicLink, signOut } = useAuth()
  const [value, setValue] = useState('')
  if (!enabled) return null

  if (email) {
    return (
      <div className="space-y-4">
        <p className="text-[15px] text-muted">
          You're signed in as <span className="font-medium text-fg">{email}</span>. Your portfolio is saved to your
          account.
        </p>
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
        <p className="text-[15px] text-muted">
          We sent a sign-in link to {linkSentTo}. You can keep playing in the meantime.
        </p>
      </div>
    )
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (value.includes('@')) void sendMagicLink(value.trim())
      }}
    >
      <p className="text-[15px] text-muted">
        Save your portfolio on any device and join the leaderboard. No password, just a link in your email.
      </p>
      <input
        type="email"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Email address"
        aria-label="Email address"
        className="h-12 w-full rounded-xl bg-fill px-4 text-[17px] outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/50"
      />
      <Button type="submit" size="lg" className="w-full">
        Continue
      </Button>
      {error && <p className="text-sm text-loss">{error}</p>}
    </form>
  )
}
