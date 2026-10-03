import { useState } from 'react'
import { api } from '../api/client'
import { Button, Card } from '../components/ui'
import { loadClasses, saveClass } from '../lib/classrooms'
import { useGame } from '../store/gameStore'

type Tab = 'join' | 'teach'

const input =
  'h-12 w-full rounded-xl bg-fill px-4 text-[17px] outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/50'

export function ClassroomView() {
  const [tab, setTab] = useState<Tab>('join')
  return (
    <main className="mx-auto max-w-md px-5 pt-12 pb-6">
      <h1 className="text-center text-[40px] leading-tight font-bold">Classroom</h1>
      <div className="mt-6 flex justify-center">
        <div className="inline-flex rounded-full bg-fill p-1" role="tablist">
          {(['join', 'teach'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`h-8 rounded-full px-5 text-[13px] font-medium transition ${
                tab === t ? 'bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.12)]' : 'text-muted'
              }`}
            >
              {t === 'join' ? 'I’m a student' : 'I’m a teacher'}
            </button>
          ))}
        </div>
      </div>
      <div key={tab} className="animate-fade-up mt-8">
        {tab === 'join' ? <Join /> : <Teach />}
      </div>
    </main>
  )
}

function Join() {
  const { joinClass, busy } = useGame()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  return (
    <Card>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (code.trim() && name.trim()) void joinClass(code, name)
        }}
      >
        <input
          className={`${input} text-center font-semibold tracking-[0.3em] uppercase`}
          placeholder="CLASS CODE"
          aria-label="Class code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        />
        <input
          className={input}
          placeholder="Your first name"
          aria-label="Your name"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" size="lg" className="w-full" disabled={busy || code.length < 6 || !name.trim()}>
          Join class
        </Button>
      </form>
    </Card>
  )
}

function Teach() {
  const { openTeacher } = useGame()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const classes = loadClasses()

  async function create() {
    setBusy(true)
    setError(null)
    try {
      const room = await api.createClass(name.trim())
      saveClass({ code: room.code, name: room.name, token: room.teacher_token })
      openTeacher(room.code)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t create the class.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) void create()
          }}
        >
          <input
            className={input}
            placeholder="Class name, e.g. Period 3 Economics"
            aria-label="Class name"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" size="lg" className="w-full" disabled={busy || !name.trim()}>
            Create class
          </Button>
          {error && <p className="text-[15px] text-loss">{error}</p>}
        </form>
        <p className="mt-4 text-[13px] text-muted">
          Everyone in the class plays the same five companies. You’ll see results live.
        </p>
      </Card>

      {classes.length > 0 && (
        <Card className="px-0 py-2">
          <ul className="divide-y divide-line">
            {classes.map((c) => (
              <li key={c.code}>
                <button
                  onClick={() => openTeacher(c.code)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-fill/50"
                >
                  <span className="text-[17px] font-semibold">{c.name}</span>
                  <span className="font-mono text-[15px] text-muted">{c.code} ›</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
