/** Small per-device stats used for achievements (quiz answers, etc.). */

const KEY = 'tankday.progress.v1'

export interface Progress {
  quizRight: number
  quizTotal: number
}

export function loadProgress(): Progress {
  try {
    return { quizRight: 0, quizTotal: 0, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { quizRight: 0, quizTotal: 0 }
  }
}

export function recordQuiz(correct: boolean): Progress {
  const p = loadProgress()
  const next = { quizRight: p.quizRight + (correct ? 1 : 0), quizTotal: p.quizTotal + 1 }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable */
  }
  return next
}
