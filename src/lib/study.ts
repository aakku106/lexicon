import type { CategoryId, FlashcardSession, FlashcardSessionCard, Term, TermProgress } from '../types'
import { dueTerms, troubleTerms, unseenTerms } from './stats'

export type StudyMode = 'smart' | 'trouble' | 'practice'

export interface BuildQueueOptions {
  mode: StudyMode
  category: CategoryId | 'all'
  size: number
  now?: number
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

export function buildReviewQueue(
  terms: Term[],
  progress: Record<string, TermProgress>,
  options: BuildQueueOptions,
): Term[] {
  const now = options.now ?? Date.now()
  const category = options.category
  const scoped =
    category === 'all'
      ? terms
      : terms.filter(
          (term) =>
            term.category === category || term.alsoIn?.includes(category),
        )

  if (options.mode === 'practice') {
    return shuffle(scoped).slice(0, options.size)
  }

  if (options.mode === 'trouble') {
    return troubleTerms(scoped, progress).slice(0, options.size)
  }

  const selected: Term[] = []
  const used = new Set<string>()

  for (const term of dueTerms(scoped, progress, now)) {
    if (selected.length >= options.size) break
    if (!used.has(term.id)) {
      selected.push(term)
      used.add(term.id)
    }
  }

  for (const term of troubleTerms(scoped, progress)) {
    if (selected.length >= options.size) break
    if (!used.has(term.id)) {
      selected.push(term)
      used.add(term.id)
    }
  }

  const fresh = unseenTerms(scoped, progress).sort((a, b) => {
    const tierA = a.tier ?? 9
    const tierB = b.tier ?? 9
    if (tierA !== tierB) return tierA - tierB
    return a.term.localeCompare(b.term)
  })

  for (const term of fresh) {
    if (selected.length >= options.size) break
    if (!used.has(term.id)) {
      selected.push(term)
      used.add(term.id)
    }
  }

  return selected
}

export function createSession(
  terms: Term[],
  options: BuildQueueOptions,
): FlashcardSession | null {
  const cards: FlashcardSessionCard[] = terms.map((term) => ({
    termId: term.id,
    retried: false,
  }))
  if (cards.length === 0) return null
  return {
    id: `session-${Date.now()}`,
    mode: options.mode,
    category: options.category,
    cards,
    index: 0,
    startedAt: Date.now(),
    correctIds: [],
    missedIds: [],
    completed: false,
  }
}

export function sessionTermIds(session: FlashcardSession): string[] {
  return session.cards.map((card) => card.termId)
}

export function sessionStats(session: FlashcardSession): {
  total: number
  completed: number
  correct: number
  missed: number
  remaining: number
} {
  return {
    total: session.cards.length,
    completed: Math.min(session.index, session.cards.length),
    correct: session.correctIds.length,
    missed: session.missedIds.length,
    remaining: Math.max(0, session.cards.length - session.index),
  }
}
