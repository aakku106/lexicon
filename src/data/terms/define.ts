import type { CategoryId, Term, TermInput } from '../../types'
import { slugify } from '../../lib/slug'

/**
 * Terms are authored with a short shape and get their stable URL id from the
 * term name. Keeping one canonical entry per concept means progress, notes and
 * bookmarks never split across duplicate cards.
 */
export function defineTerms(category: CategoryId, inputs: TermInput[]): Term[] {
  return inputs.map((input) => ({
    ...input,
    id: slugify(input.term),
    category,
  }))
}
