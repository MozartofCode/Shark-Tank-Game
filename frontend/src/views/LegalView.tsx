import type { ReactNode } from 'react'
import { Button } from '../components/ui'
import { useGame } from '../store/gameStore'

const CONTACT = import.meta.env.VITE_CONTACT_EMAIL as string | undefined
const UPDATED = 'October 3, 2026'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-[20px] font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  )
}

function Contact() {
  return CONTACT ? (
    <a className="text-accent hover:underline" href={`mailto:${CONTACT}`}>
      {CONTACT}
    </a>
  ) : (
    <a className="text-accent hover:underline" href="https://github.com/MozartofCode/Shark-Tank-Game/issues">
      our GitHub page
    </a>
  )
}

export function PrivacyView() {
  const { goHome } = useGame()
  return (
    <main className="mx-auto max-w-2xl px-5 pt-12 pb-6">
      <h1 className="text-[40px] leading-tight font-bold">Privacy</h1>
      <p className="mt-2 text-[13px] text-faint">Last updated {UPDATED}</p>

      <Section title="The short version">
        <p>
          You can play without an account. If you sign in, we store your email so we can save your portfolio. We don’t
          sell your data and there are no ads.
        </p>
      </Section>
      <Section title="What we collect">
        <p>
          <strong className="text-fg">Playing as a guest:</strong> your game progress (offers, questions you ask the
          founder) is stored on our server under a random game ID, and your portfolio is saved in your browser.
        </p>
        <p>
          <strong className="text-fg">Signing in:</strong> your email address and an automatically created username,
          plus the results of the days you play (shown on the leaderboard by username only).
        </p>
        <p>
          <strong className="text-fg">Classrooms:</strong> the display name you type and your results, visible to the
          teacher who made the class.
        </p>
        <p>
          <strong className="text-fg">Technical data:</strong> your IP address is used briefly to prevent abuse (rate
          limits) and isn’t stored with your account.
        </p>
      </Section>
      <Section title="Who else is involved">
        <p>
          Accounts and data are hosted by Supabase. Questions you ask the founder may be sent to Anthropic’s AI to write
          the answer. Pitch videos are played by YouTube (privacy-enhanced mode), which may set cookies when you press
          play.
        </p>
      </Section>
      <Section title="Kids and teens">
        <p>
          Tank Day is made for learning and is fine to play without an account at any age. You must be 13 or older to
          create an account. If you believe a child under 13 signed up, contact us and we’ll delete the account.
        </p>
      </Section>
      <Section title="Your choices">
        <p>
          You can sign out at any time. To delete your account and saved results, contact <Contact />.
        </p>
      </Section>

      <Button variant="secondary" onClick={goHome} className="mt-10">
        Done
      </Button>
    </main>
  )
}

export function TermsView() {
  const { goHome } = useGame()
  return (
    <main className="mx-auto max-w-2xl px-5 pt-12 pb-6">
      <h1 className="text-[40px] leading-tight font-bold">Terms</h1>
      <p className="mt-2 text-[13px] text-faint">Last updated {UPDATED}</p>

      <Section title="It’s a game">
        <p>
          Tank Day is an educational game. All money in it is pretend. Nothing here is financial, investment or legal
          advice.
        </p>
      </Section>
      <Section title="About the companies">
        <p>
          Company outcomes come from public news reports and may be incomplete or out of date. Values for private
          companies are estimates. The sharks in the game are fictional characters, not the real Shark Tank cast.
        </p>
      </Section>
      <Section title="Videos">
        <p>
          Pitch videos are embedded from official YouTube channels and belong to their owners. Tank Day is not
          affiliated with Shark Tank, ABC or Sony Pictures Television.
        </p>
      </Section>
      <Section title="Accounts">
        <p>
          You need to be 13 or older to create an account. Please choose a username that’s kind. We may remove
          usernames or results that break these rules.
        </p>
      </Section>
      <Section title="Contact">
        <p>
          Questions? Reach us at <Contact />.
        </p>
      </Section>

      <Button variant="secondary" onClick={goHome} className="mt-10">
        Done
      </Button>
    </main>
  )
}
