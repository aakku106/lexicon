import type {
  CategoryId,
  DayActivity,
  Distinction,
  QuizHistoryEntry,
  Term,
  TermProgress,
  Tier,
} from '../types'
import { CATEGORIES } from '../data/categories'
import { TERMS_BY_CATEGORY, TIER_TERMS } from '../data/catalog'
import { isDue, isTrouble } from './srs'
import { lastNDateKeys, toDateKey } from './date'

export interface StudyStats {
  totalTerms: number
  seenTerms: number
  knownTerms: number
  learningTerms: number
  newTerms: number
  dueTerms: number
  troubleTerms: number
  bookmarkedTerms: number
  totalReviews: number
  totalQuizAnswers: number
  totalCorrect: number
  totalMissed: number
  accuracyPct: number | null
  currentStreak: number
  longestStreak: number
  activeDays: number
  todayReps: number
  todayGoal: number
}

export interface CategoryProgress {
  category: (typeof CATEGORIES)[number]
  total: number
  seen: number
  known: number
  learning: number
  due: number
  trouble: number
  seenPct: number
  knownPct: number
}

export interface TierProgress {
  tier: Tier
  total: number
  seen: number
  known: number
  seenPct: number
  knownPct: number
}

export interface HeatmapCell {
  key: string
  count: number
  reviews: number
  quiz: number
  future: boolean
}

export function activityTotal(day: DayActivity | undefined): number {
  if (!day) return 0
  return day.reviews + day.quiz
}

export function todayReps(activity: Record<string, DayActivity>, now = Date.now()): number {
  return activityTotal(activity[toDateKey(now)])
}

export function computeStreak(activity: Record<string, DayActivity>, now = new Date()): number {
  let offset = 0
  const todayKey = toDateKey(now)
  if (activityTotal(activity[todayKey]) === 0) offset = 1
  let streak = 0
  for (let i = offset; i < 3660; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const count = activityTotal(activity[toDateKey(date)])
    if (count === 0) break
    streak += 1
  }
  return streak
}

export function computeLongestStreak(activity: Record<string, DayActivity>): number {
  const keys = Object.keys(activity)
    .filter((key) => activityTotal(activity[key]) > 0)
    .sort()
  if (keys.length === 0) return 0
  let longest = 1
  let current = 1
  for (let i = 1; i < keys.length; i += 1) {
    const previous = new Date(`${keys[i - 1]}T00:00:00`)
    const currentDate = new Date(`${keys[i]}T00:00:00`)
    const diffDays = Math.round((currentDate.getTime() - previous.getTime()) / 86_400_000)
    if (diffDays === 1) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }
  return longest
}

export function computeStats(
  terms: Term[],
  progress: Record<string, TermProgress>,
  activity: Record<string, DayActivity>,
  bookmarks: string[],
  dailyGoal: number,
  now = Date.now(),
): StudyStats {
  let seenTerms = 0
  let knownTerms = 0
  let learningTerms = 0
  let dueTerms = 0
  let troubleTerms = 0
  let totalCorrect = 0
  let totalMissed = 0

  for (const term of terms) {
    const entry = progress[term.id]
    if (entry && (entry.seen > 0 || entry.status !== 'new')) seenTerms += 1
    if (entry?.status === 'known') knownTerms += 1
    if (entry?.status === 'learning') learningTerms += 1
    if (isDue(entry, now)) dueTerms += 1
    if (isTrouble(entry)) troubleTerms += 1
    if (entry) {
      totalCorrect += entry.correct
      totalMissed += entry.missed
    }
  }

  let totalReviews = 0
  let totalQuizAnswers = 0
  let activeDays = 0
  for (const day of Object.values(activity)) {
    totalReviews += day.reviews
    totalQuizAnswers += day.quiz
    if (activityTotal(day) > 0) activeDays += 1
  }

  const attempts = totalCorrect + totalMissed
  return {
    totalTerms: terms.length,
    seenTerms,
    knownTerms,
    learningTerms,
    newTerms: terms.length - seenTerms,
    dueTerms,
    troubleTerms,
    bookmarkedTerms: bookmarks.length,
    totalReviews,
    totalQuizAnswers,
    totalCorrect,
    totalMissed,
    accuracyPct: attempts ? Math.round((totalCorrect / attempts) * 100) : null,
    currentStreak: computeStreak(activity, new Date(now)),
    longestStreak: computeLongestStreak(activity),
    activeDays,
    todayReps: todayReps(activity, now),
    todayGoal: dailyGoal,
  }
}

export function categoryProgress(
  progress: Record<string, TermProgress>,
  now = Date.now(),
): CategoryProgress[] {
  return CATEGORIES.map((category) => {
    const terms = TERMS_BY_CATEGORY[category.id]
    let seen = 0
    let known = 0
    let due = 0
    let trouble = 0
    for (const term of terms) {
      const entry = progress[term.id]
      if (entry && (entry.seen > 0 || entry.status !== 'new')) seen += 1
      if (entry?.status === 'known') known += 1
      if (isDue(entry, now)) due += 1
      if (isTrouble(entry)) trouble += 1
    }
    return {
      category,
      total: terms.length,
      seen,
      known,
      learning: seen - known,
      due,
      trouble,
      seenPct: terms.length ? Math.round((seen / terms.length) * 100) : 0,
      knownPct: terms.length ? Math.round((known / terms.length) * 100) : 0,
    }
  })
}

export function tierProgress(
  progress: Record<string, TermProgress>,
): TierProgress[] {
  return ([1, 2, 3] as const).map((tier) => {
    const terms = TIER_TERMS[tier]
    let seen = 0
    let known = 0
    for (const term of terms) {
      const entry = progress[term.id]
      if (entry && (entry.seen > 0 || entry.status !== 'new')) seen += 1
      if (entry?.status === 'known') known += 1
    }
    return {
      tier,
      total: terms.length,
      seen,
      known,
      seenPct: terms.length ? Math.round((seen / terms.length) * 100) : 0,
      knownPct: terms.length ? Math.round((known / terms.length) * 100) : 0,
    }
  })
}

export function troubleTerms(
  terms: Term[],
  progress: Record<string, TermProgress>,
): Term[] {
  return terms
    .filter((term) => isTrouble(progress[term.id]))
    .sort((a, b) => {
      const pa = progress[a.id]
      const pb = progress[b.id]
      return (pb?.missed ?? 0) - (pa?.missed ?? 0)
    })
}

export function dueTerms(terms: Term[], progress: Record<string, TermProgress>, now = Date.now()): Term[] {
  return terms
    .filter((term) => isDue(progress[term.id], now))
    .sort((a, b) => (progress[a.id]?.dueAt ?? 0) - (progress[b.id]?.dueAt ?? 0))
}

export function unseenTerms(
  terms: Term[],
  progress: Record<string, TermProgress>,
): Term[] {
  return terms.filter((term) => {
    const entry = progress[term.id]
    return !entry || (entry.seen === 0 && entry.status === 'new')
  })
}

export function getHeatmapWeeks(
  activity: Record<string, DayActivity>,
  weeks = 17,
  now = new Date(),
): HeatmapCell[][] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  start.setDate(start.getDate() - start.getDay() - (weeks - 1) * 7)
  const columns: HeatmapCell[][] = []
  for (let week = 0; week < weeks; week += 1) {
    const cells: HeatmapCell[] = []
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(start)
      date.setDate(start.getDate() + week * 7 + day)
      const key = toDateKey(date)
      const entry = activity[key]
      cells.push({
        key,
        count: activityTotal(entry),
        reviews: entry?.reviews ?? 0,
        quiz: entry?.quiz ?? 0,
        future: date.getTime() > now.getTime() + 86_400_000,
      })
    }
    columns.push(cells)
  }
  return columns
}

export function recentDays(
  activity: Record<string, DayActivity>,
  count = 7,
): Array<{ key: string; day: DayActivity | undefined; total: number }> {
  return lastNDateKeys(count).map((key) => ({
    key,
    day: activity[key],
    total: activityTotal(activity[key]),
  }))
}

export function quizAverage(history: QuizHistoryEntry[]): number | null {
  if (!history.length) return null
  const totalScore = history.reduce((sum, entry) => sum + entry.score, 0)
  const totalQuestions = history.reduce((sum, entry) => sum + entry.total, 0)
  return totalQuestions ? Math.round((totalScore / totalQuestions) * 100) : null
}

export function streakLabel(streak: number): string {
  if (streak === 0) return 'Start today'
  if (streak === 1) return '1 day'
  return `${streak} days`
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function dailyPick<T>(items: T[], salt: string, date = new Date()): T | undefined {
  if (items.length === 0) return undefined
  const hash = hashString(`${toDateKey(date)}:${salt}`)
  return items[hash % items.length]
}

export function dailyTerm(terms: Term[], date = new Date()): Term | undefined {
  const priority = terms.filter((term) => term.tier === 1 || term.tier === 2)
  return dailyPick(priority.length ? priority : terms, 'word', date)
}

export function dailyDistinction(
  distinctions: Distinction[],
  date = new Date(),
): Distinction | undefined {
  return dailyPick(distinctions, 'distinction', date)
}

export function categoryById(id: CategoryId) {
  return CATEGORIES.find((category) => category.id === id)
}
