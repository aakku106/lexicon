import type { CategoryId, Term, Tier } from '../types'
import { CATEGORIES } from './categories'
import { foundationsTerms } from './terms/foundations'
import { algorithmsTerms } from './terms/algorithms'
import { hashingTerms } from './terms/hashing'
import { operatingSystemsTerms } from './terms/operatingSystems'
import { goConcurrencyTerms } from './terms/goConcurrency'
import { networkingTerms } from './terms/networking'
import { httpBackendTerms } from './terms/httpBackend'
import { databaseTerms } from './terms/databases'
import { distributedSystemsTerms } from './terms/distributedSystems'
import { cachingTerms } from './terms/caching'
import { architectureTerms } from './terms/architecture'
import { patternTerms } from './terms/patterns'
import { reliabilityTerms } from './terms/reliability'
import { securityTerms } from './terms/security'
import { gitTerms } from './terms/git'
import { testingTerms } from './terms/testing'
import { webArchitectureTerms } from './terms/webArchitecture'
import { cloudTerms } from './terms/cloud'
import { devopsTerms } from './terms/devops'
import { aiTerms } from './terms/ai'

export const TERMS: Term[] = [
  ...foundationsTerms,
  ...algorithmsTerms,
  ...hashingTerms,
  ...operatingSystemsTerms,
  ...goConcurrencyTerms,
  ...networkingTerms,
  ...httpBackendTerms,
  ...databaseTerms,
  ...distributedSystemsTerms,
  ...cachingTerms,
  ...architectureTerms,
  ...patternTerms,
  ...reliabilityTerms,
  ...securityTerms,
  ...gitTerms,
  ...testingTerms,
  ...webArchitectureTerms,
  ...cloudTerms,
  ...devopsTerms,
  ...aiTerms,
]

if (import.meta.env.DEV) {
  const seen = new Map<string, string>()
  for (const term of TERMS) {
    const existing = seen.get(term.id)
    if (existing) {
      throw new Error(`Duplicate term id "${term.id}" (${existing} / ${term.term})`)
    }
    seen.set(term.id, term.term)
  }
}

export const TERM_BY_ID = new Map(TERMS.map((term) => [term.id, term]))

export const TERMS_ALPHABETICAL = [...TERMS].sort((a, b) =>
  a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }),
)

export function getTermCategories(term: Term): CategoryId[] {
  return [term.category, ...(term.alsoIn ?? []).filter((id) => id !== term.category)]
}

export function termBelongsToCategory(term: Term, category: CategoryId): boolean {
  return term.category === category || Boolean(term.alsoIn?.includes(category))
}

export const TERMS_BY_CATEGORY = Object.fromEntries(
  CATEGORIES.map((category) => [
    category.id,
    TERMS.filter((term) => termBelongsToCategory(term, category.id)),
  ]),
) as Record<CategoryId, Term[]>

export const TERM_BY_NAME = new Map<string, Term>()
for (const term of TERMS) {
  TERM_BY_NAME.set(term.term.toLowerCase(), term)
  for (const alias of term.aliases ?? []) {
    if (!TERM_BY_NAME.has(alias.toLowerCase())) {
      TERM_BY_NAME.set(alias.toLowerCase(), term)
    }
  }
}

export function findTermByName(name: string): Term | undefined {
  return TERM_BY_NAME.get(name.toLowerCase())
}

export function containingCategories(term: Term): CategoryId[] {
  return getTermCategories(term)
}

export function relatedTerms(term: Term, limit = 4): Term[] {
  const categories = getTermCategories(term)
  return TERMS.filter(
    (candidate) =>
      candidate.id !== term.id &&
      getTermCategories(candidate).some((category) => categories.includes(category)),
  )
    .sort((a, b) => {
      const aShared = getTermCategories(a).filter((c) => categories.includes(c)).length
      const bShared = getTermCategories(b).filter((c) => categories.includes(c)).length
      if (aShared !== bShared) return bShared - aShared
      return a.term.localeCompare(b.term)
    })
    .slice(0, limit)
}

export const TIER_TERMS: Record<Tier, Term[]> = {
  1: TERMS.filter((term) => term.tier === 1),
  2: TERMS.filter((term) => term.tier === 2),
  3: TERMS.filter((term) => term.tier === 3),
}

export const TOTAL_TERMS = TERMS.length

/** All unique primary categories in a stable authored order. */
export const CATEGORY_ORDER = CATEGORIES.map((category) => category.id)
