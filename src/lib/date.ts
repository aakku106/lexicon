const DAY_MS = 86_400_000

export function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** Local calendar date, not UTC — important for streaks and daily stats. */
export function toDateKey(value: Date | number = new Date()): string {
  const date = typeof value === 'number' ? new Date(value) : value
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function startOfLocalDay(value: Date | number = new Date()): number {
  const date = typeof value === 'number' ? new Date(value) : value
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function addDays(value: number | Date, days: number): Date {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

export function addDaysMs(value: number, days: number): number {
  return value + days * DAY_MS
}

export function daysBetween(aKey: string, bKey: string): number {
  return Math.round((dateFromKey(bKey).getTime() - dateFromKey(aKey).getTime()) / DAY_MS)
}

export function greeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: new Date(timestamp).getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(new Date(timestamp))
}

export function formatFullDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(timestamp))
}

export function formatInterval(days: number): string {
  if (days <= 0) return '10m'
  if (days < 1) return '<1d'
  if (days === 1) return '1d'
  if (days < 30) return `${Math.round(days)}d`
  if (days < 365) {
    const months = Math.round(days / 30)
    return `${months}mo`
  }
  const years = Math.round(days / 365)
  return `${years}y`
}

export function formatRelativeDue(dueAt: number | null, now = Date.now()): string {
  if (!dueAt) return 'Not scheduled'
  const diff = dueAt - now
  if (diff <= 0) {
    const overdue = Math.abs(diff)
    if (overdue < 60_000) return 'Due now'
    if (overdue < 3_600_000) return `Overdue ${Math.round(overdue / 60_000)}m`
    if (overdue < DAY_MS) return `Overdue ${Math.round(overdue / 3_600_000)}h`
    return `Overdue ${Math.round(overdue / DAY_MS)}d`
  }
  if (diff < 60_000) return 'Due in <1m'
  if (diff < 3_600_000) return `Due in ${Math.round(diff / 60_000)}m`
  if (diff < DAY_MS) return `Due in ${Math.round(diff / 3_600_000)}h`
  return `Due in ${Math.round(diff / DAY_MS)}d`
}

export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return remaining ? `${minutes}m ${remaining}s` : `${minutes}m`
}

export function isToday(timestamp: number): boolean {
  return toDateKey(timestamp) === toDateKey()
}

/** Last N local dates, oldest first. */
export function lastNDateKeys(count: number, now = new Date()): string[] {
  const keys: string[] = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
    keys.push(toDateKey(date))
  }
  return keys
}

export { DAY_MS }
