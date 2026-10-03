import { useState } from 'react'
import { useAuth } from '../store/authStore'
import { Button } from './ui'

/** Magic-link sign-in. Renders nothing when accounts aren't configured. */
export function AccountPanel({ compact = false }: { compact?: boolean }) {
  const { enabled, email, linkSentTo, error, sendMagicLink, signOut } = useAuth()
  const [value, setValue] = useState('')
  if (!enabled) return null

  if (email) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted">
          Signed in as <span className="text-[#e6ecf7]">{email}</span>
        </span>
        <button onClick={signOut} className="text-muted underline hover:text-[#e6ecf7]">
          Sign out
        </button>
      </div>
    )
  }

  if (linkSentTo) {
    return (
      <p className="text-sm text-win">
        Check {linkSentTo} for your sign-in link. You can keep playing; your run will be saved when you sign in.
      </p>
    )
  }

  return (
    <form
      className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'justify-center'}`}
      onSubmit={(e) => {
        e.preventDefault()
        if (value.includes('@')) void sendMagicLink(value.trim())
      }}
    >
      <input
        type="email"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email address"
        className="w-56 rounded-xl border border-line bg-stage px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-sea"
      />
      <Button type="submit" variant="ghost">
        Email me a sign-in link
      </Button>
      {error && <p className="w-full text-sm text-loss">{error}</p>}
    </form>
  )
}
