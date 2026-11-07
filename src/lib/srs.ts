import type { ReviewRating, TermProgress } from '../types'
import { DAY_MS, addDaysMs } from './date'

export const START_EASE = 2.5
export const MIN_EASE = 1.3
export const MAX_EASE = 3.2
export const MASTERED_INTERVAL_DAYS = 21

export function createEmptyProgress(): TermProgress {
  return {
    status: 'new',
    reps: 0,
    lapses: 0,
    intervalDays: 0,
    ease: START_EASE,
    dueAt: null,
    lastReviewedAt: null,
    seen: 0,
    correct: 0,
    missed: 0,
    lastMissedAt: null,
  }
}

function clampEase(ease: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, ease))
}

interface IntervalPreview {
  rating: ReviewRating
  label: string
  intervalDays: number
}

function nextInterval(progress: TermProgress, rating: ReviewRating): number {
  const { intervalDays, reps, ease } = progress
  switch (rating) {
    case 'again':
      return 0
    case 'hard':
      return intervalDays > 0 ? Math.max(1, Math.round(intervalDays * 1.2)) : 1
    case 'good':
      if (reps <= 0) return 1
      if (reps === 1) return 3
      return Math.max(1, Math.round(intervalDays * ease))
    case 'easy':
      return Math.max(4, Math.round(Math.max(intervalDays, 1) * ease * 1.35))
  }
}

export function previewIntervals(progress: TermProgress): IntervalPreview[] {
  return (['again', 'hard', 'good', 'easy'] as const).map((rating) => {
    const days = nextInterval(progress, rating)
    let label: string
    if (rating === 'again') label = '10m'
    else if (days === 1) label = '1d'
    else if (days < 30) label = `${days}d`
    else if (days < 365) label = `${Math.round(days / 30)}mo`
    else label = `${Math.round(days / 365)}y`
    return { rating, label, intervalDays: days }
  })
}

/**
 * A compact SM-2-inspired scheduler. The rating is the learner's felt
 * difficulty, not their correctness: even a correct answer can be "Hard".
 */
export function reviewProgress(
  existing: TermProgress | undefined,
  rating: ReviewRating,
  now = Date.now(),
): TermProgress {
  const current = existing ?? createEmptyProgress()
  const intervalDays = nextInterval(current, rating)
  let ease = current.ease
  let lapses = current.lapses
  let reps = current.reps
  let missed = current.missed
  let correct = current.correct
  let lastMissedAt = current.lastMissedAt
  let dueAt: number
  let status: TermProgress['status']

  if (rating === 'again') {
    ease = clampEase(ease - 0.2)
    lapses += 1
    missed += 1
    status = 'learning'
    lastMissedAt = now
    dueAt = now + 10 * 60 * 1000
  } else {
    if (rating === 'hard') ease = clampEase(ease - 0.15)
    if (rating === 'easy') ease = clampEase(ease + 0.15)
    reps += 1
    correct += 1
    dueAt = addDaysMs(now, intervalDays)
    status =
      intervalDays >= MASTERED_INTERVAL_DAYS
        ? 'known'
        : current.status === 'known'
          ? 'known'
          : 'learning'
  }

  return {
    ...current,
    status,
    reps,
    lapses,
    intervalDays,
    ease,
    dueAt,
    lastReviewedAt: now,
    seen: current.seen + 1,
    correct,
    missed,
    lastMissedAt,
  }
}

export function applyQuizOutcome(
  existing: TermProgress | undefined,
  correct: boolean,
  now = Date.now(),
): TermProgress {
  const current = existing ?? createEmptyProgress()
  if (correct) {
    const nextCorrect = current.correct + 1
    return {
      ...current,
      status: current.status === 'new' ? 'learning' : current.status,
      seen: current.seen + 1,
      correct: nextCorrect,
    }
  }
  return {
    ...current,
    status: current.status === 'known' ? 'learning' : current.status === 'new' ? 'learning' : current.status,
    seen: current.seen + 1,
    missed: current.missed + 1,
    lastMissedAt: now,
  }
}

export function markAsKnown(existing: TermProgress | undefined, now = Date.now()): TermProgress {
  const current = existing ?? createEmptyProgress()
  return {
    ...current,
    status: 'known',
    intervalDays: Math.max(30, current.intervalDays),
    dueAt: addDaysMs(now, Math.max(30, current.intervalDays)),
    lastReviewedAt: now,
  }
}

export function markAsLearning(existing: TermProgress | undefined, now = Date.now()): TermProgress {
  const current = existing ?? createEmptyProgress()
  return {
    ...current,
    status: 'learning',
    dueAt: now,
    lastReviewedAt: now,
  }
}

export function isTrouble(progress: TermProgress | undefined): boolean {
  if (!progress) return false
  const attempts = progress.correct + progress.missed
  return progress.missed >= 2 && attempts > 0 && progress.missed / attempts >= 0.5
}

export function isDue(progress: TermProgress | undefined, now = Date.now()): boolean {
  return Boolean(progress?.dueAt && progress.dueAt <= now)
}

export function accuracy(progress: TermProgress | undefined): number | null {
  if (!progress) return null
  const attempts = progress.correct + progress.missed
  if (!attempts) return null
  return Math.round((progress.correct / attempts) * 100)
}

export function nextDueLabel(progress: TermProgress | undefined): string {
  if (!progress?.dueAt) return 'Not scheduled'
  const diff = progress.dueAt - Date.now()
  if (diff <= 0) return 'Due now'
  if (diff < 60 * 60 * 1000) return `in ${Math.max(1, Math.round(diff / 60_000))}m`
  if (diff < DAY_MS) return `in ${Math.round(diff / 3_600_000)}h`
  return `in ${Math.round(diff / DAY_MS)}d`
}
