import type { CategoryId, Term, TermProgress, Tier } from '../types'
import { CATEGORY_BY_ID } from '../data/categories'
import { termBelongsToCategory } from '../data/catalog'
import { isTrouble } from './srs'

export type StatusFilter = 'all' | 'new' | 'learning' | 'known' | 'bookmarked' | 'trouble'
export type SortMode = 'az' | 'za' | 'category' | 'weakest'

export interface TermFilters {
  query: string
  category: CategoryId | 'all'
  tier: Tier | 'all'
  status: StatusFilter
  sort: SortMode
}

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export interface SearchResult {
  term: Term
  score: number
}

export function searchTerms(terms: Term[], query: string, limit = 100): SearchResult[] {
  const normalized = normalize(query)
  if (!normalized) {
    return terms.slice(0, limit).map((term) => ({ term, score: 0 }))
  }
  const tokens = normalized.split(/\s+/).filter(Boolean)
  const results: SearchResult[] = []

  for (const term of terms) {
    const termName = normalize(term.term)
    const aliases = (term.aliases ?? []).map(normalize)
    const definition = normalize(term.definition)
    const category = normalize(CATEGORY_BY_ID[term.category].name)
    const haystack = [termName, ...aliases, definition, category, ...(term.alsoIn ?? []).map((id) => normalize(CATEGORY_BY_ID[id].name))].join(' ')
    if (!tokens.every((token) => haystack.includes(token))) continue

    let score = 0
    if (termName === normalized) score += 100
    if (termName.startsWith(normalized)) score += 60
    if (termName.includes(normalized)) score += 35
    if (aliases.some((alias) => alias === normalized)) score += 50
    if (aliases.some((alias) => alias.includes(normalized))) score += 20
    if (definition.includes(normalized)) score += 8
    score += Math.max(0, 10 - term.term.length / 20)
    results.push({ term, score })
  }

  return results
    .sort((a, b) => b.score - a.score || a.term.term.localeCompare(b.term.term))
    .slice(0, limit)
}

export function filterTerms(
  terms: Term[],
  filters: TermFilters,
  progress: Record<string, TermProgress>,
  bookmarks: string[],
): Term[] {
  let result = filters.query
    ? searchTerms(terms, filters.query, terms.length).map((entry) => entry.term)
    : [...terms]

  if (filters.category !== 'all') {
    result = result.filter((term) => termBelongsToCategory(term, filters.category as CategoryId))
  }

  if (filters.tier !== 'all') {
    result = result.filter((term) => term.tier === filters.tier)
  }

  if (filters.status !== 'all') {
    result = result.filter((term) => {
      const entry = progress[term.id]
      switch (filters.status) {
        case 'new':
          return !entry || (entry.seen === 0 && entry.status === 'new')
        case 'learning':
          return entry?.status === 'learning'
        case 'known':
          return entry?.status === 'known'
        case 'bookmarked':
          return bookmarks.includes(term.id)
        case 'trouble':
          return isTrouble(entry)
        default:
          return true
      }
    })
  }

  if (!filters.query) {
    switch (filters.sort) {
      case 'az':
        result.sort((a, b) => a.term.localeCompare(b.term))
        break
      case 'za':
        result.sort((a, b) => b.term.localeCompare(a.term))
        break
      case 'category':
        result.sort((a, b) => {
          const categoryA = CATEGORY_BY_ID[a.category].order
          const categoryB = CATEGORY_BY_ID[b.category].order
          return categoryA - categoryB || a.term.localeCompare(b.term)
        })
        break
      case 'weakest':
        result.sort((a, b) => {
          const pa = progress[a.id]
          const pb = progress[b.id]
          const accuracyA = pa ? pa.correct / Math.max(1, pa.correct + pa.missed) : 1
          const accuracyB = pb ? pb.correct / Math.max(1, pb.correct + pb.missed) : 1
          return accuracyA - accuracyB || (pb?.missed ?? 0) - (pa?.missed ?? 0)
        })
        break
    }
  }

  return result
}
