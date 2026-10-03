import { TERMS } from '../lib/glossary'
import { useGame } from '../store/gameStore'
import { AccountPanel } from './AccountPanel'
import { Button, Sheet } from './ui'

export function Sheets() {
  const { sheet, openSheet, term, openTerm, openLearn } = useGame()

  if (term && TERMS[term]) {
    const t = TERMS[term]
    return (
      <Sheet title={t.term} onClose={() => openTerm(null)}>
        <p className="text-[17px] leading-relaxed">{t.short}</p>
        {t.example && <p className="mt-3 rounded-2xl bg-fill px-4 py-3 text-[15px] text-muted">{t.example}</p>}
        <Button variant="plain" onClick={openLearn} className="mt-5">
          All money words ›
        </Button>
      </Sheet>
    )
  }
  if (sheet === 'account') {
    return (
      <Sheet title="Account" onClose={() => openSheet(null)}>
        <AccountPanel />
      </Sheet>
    )
  }
  return null
}
