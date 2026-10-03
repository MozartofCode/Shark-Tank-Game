import { useMemo, useState } from 'react'
import { Button, Card } from '../components/ui'
import { GLOSSARY } from '../lib/glossary'
import { useGame } from '../store/gameStore'

/** The finance glossary: every money word in the game, grouped and searchable. */
export function LearnView() {
  const { back, returnTo } = useGame()
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return GLOSSARY
    return GLOSSARY.map((g) => ({
      ...g,
      terms: g.terms.filter((t) => `${t.term} ${t.short} ${t.example ?? ''}`.toLowerCase().includes(q)),
    })).filter((g) => g.terms.length)
  }, [query])

  return (
    <main className="mx-auto max-w-2xl px-5 pt-12 pb-6">
      {returnTo !== 'home' && (
        <Button variant="plain" onClick={back} className="mb-4">
          ‹ Back
        </Button>
      )}
      <h1 className="text-[40px] leading-tight font-bold">Money words</h1>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        aria-label="Search money words"
        className="mt-6 h-11 w-full rounded-xl bg-fill-strong/60 px-4 text-[17px] outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/40"
      />

      {groups.length === 0 && <p className="mt-8 text-center text-[15px] text-muted">No matches.</p>}

      {groups.map((g) => (
        <section key={g.title} className="mt-8">
          <h2 className="px-1 text-[13px] font-semibold tracking-wide text-muted uppercase">{g.title}</h2>
          <Card className="mt-2 px-0 py-1">
            <dl className="divide-y divide-line">
              {g.terms.map((t) => (
                <div key={t.id} id={t.id} className="px-6 py-4">
                  <dt className="text-[17px] font-semibold">{t.term}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-muted">{t.short}</dd>
                  {t.example && <dd className="mt-1.5 text-[13px] text-faint">e.g. {t.example}</dd>}
                </div>
              ))}
            </dl>
          </Card>
        </section>
      ))}
    </main>
  )
}
