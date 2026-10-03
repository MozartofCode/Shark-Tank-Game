import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Button, Card, Pill } from '../components/ui'
import { money, profitTone, signedMoney } from '../lib/format'
import { loadClasses } from '../lib/classrooms'
import { STATUS, UNKNOWN_STATUS } from '../lib/status'
import { useGame } from '../store/gameStore'
import type { ClassDashboard } from '../types'

export function TeacherView() {
  const { teacherClass, openPage } = useGame()
  const saved = loadClasses().find((c) => c.code === teacherClass)
  const [data, setData] = useState<ClassDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!saved) return
    let live = true
    const load = () =>
      api
        .classDashboard(saved.code, saved.token)
        .then((d) => live && (setData(d), setError(null)))
        .catch((e) => live && setError(e instanceof Error ? e.message : 'Couldn’t load the class.'))
    void load()
    const timer = setInterval(load, 10_000)
    return () => {
      live = false
      clearInterval(timer)
    }
  }, [saved?.code, saved?.token]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!saved) {
    return (
      <main className="mx-auto max-w-md px-5 pt-24 text-center">
        <p className="text-[17px] text-muted">This class was created on another device.</p>
        <Button className="mt-6" onClick={() => openPage('classroom')}>
          Back
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pt-10 pb-6">
      <p className="text-[13px] font-medium text-muted">{saved.name}</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[15px] text-muted">Students go to {window.location.host} → Classroom and enter</p>
          <p className="font-mono text-[56px] leading-none font-bold tracking-[0.15em]">{saved.code}</p>
        </div>
        <p className="text-[13px] text-faint">Updates every 10 seconds</p>
      </div>

      {error && <p className="mt-6 text-[15px] text-loss">{error}</p>}
      {data && (
        <>
          <Card className="mt-8 px-0 py-2">
            <p className="px-6 pt-3 text-[17px] font-semibold">
              Results · {data.students.length} student{data.students.length === 1 ? '' : 's'}
            </p>
            {data.students.length === 0 ? (
              <p className="px-6 py-4 text-[15px] text-muted">Waiting for the first student to finish…</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {data.students.map((s, i) => (
                  <li key={s.game_id} className="flex items-center gap-4 px-6 py-3">
                    <span className="w-6 text-right font-semibold text-faint tabular-nums">{i + 1}</span>
                    <span className="flex-1 truncate text-[15px] font-medium">{s.student}</span>
                    <span className="text-[13px] text-muted">
                      {s.deals.length} deal{s.deals.length === 1 ? '' : 's'} · {money(s.invested, { compact: true })}
                    </span>
                    <span className={`w-24 text-right text-[15px] font-semibold tabular-nums ${profitTone(s.profit)}`}>
                      {signedMoney(s.profit, true)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="mt-5 px-0 py-2">
            <p className="px-6 pt-3 text-[17px] font-semibold">The companies</p>
            <ul className="mt-2 divide-y divide-line">
              {data.company_stats.map((c) => {
                const status = STATUS[c.status] ?? UNKNOWN_STATUS
                return (
                  <li key={c.pitch_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3">
                    <span className="flex-1 text-[15px] font-medium">{c.company}</span>
                    <Pill tone={status.tone}>{status.label}</Pill>
                    <span className="w-28 text-right text-[13px] text-muted">
                      {c.investors} investor{c.investors === 1 ? '' : 's'}
                    </span>
                    <span className={`w-24 text-right text-[15px] tabular-nums ${profitTone(c.total_value - c.total_invested)}`}>
                      {c.investors ? signedMoney(c.total_value - c.total_invested, true) : '—'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card className="mt-5">
            <p className="text-[17px] font-semibold">Talk about it</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed">
              {data.prompts.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </main>
  )
}
