/** Classes this browser created (teacher access tokens live only on the teacher's device). */

const KEY = 'tankday.classes.v1'

export interface SavedClass {
  code: string
  name: string
  token: string
}

export function loadClasses(): SavedClass[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedClass[]
  } catch {
    return []
  }
}

export function saveClass(c: SavedClass): void {
  const all = [c, ...loadClasses().filter((x) => x.code !== c.code)]
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* storage unavailable: teacher must keep the dashboard tab open */
  }
}
