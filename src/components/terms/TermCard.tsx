import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Term } from '../../types'
import { CATEGORY_BY_ID } from '../../data/categories'
import { useStudy } from '../../context/StudyProvider'
import { formatRelativeDue } from '../../lib/date'
import { CategoryIcon } from '../ui/CategoryIcon'
import { StatusBadge, TierBadge } from '../ui/Badges'
import { BookmarkButton } from '../ui/BookmarkButton'
import { Highlight } from '../ui/Highlight'

export function TermCard({
  term,
  query = '',
  index,
}: {
  term: Term
  query?: string
  index?: number
}) {
  const { progress } = useStudy()
  const category = CATEGORY_BY_ID[term.category]
  const entry = progress[term.id]
  const status = entry?.status ?? 'new'

  return (
    <article className={`term-card term-card--${category.accent}`}>
      <Link to={`/terms/${term.id}`} className="term-card__link" aria-label={`Open ${term.term}`}>
        <div className="term-card__top">
          <span className={`term-card__category term-card__category--${category.accent}`}>
            <CategoryIcon name={category.icon} size={15} />
            {category.shortName}
          </span>
          <span className="term-card__index">{typeof index === 'number' ? String(index + 1).padStart(2, '0') : ''}</span>
        </div>

        <h3>
          <Highlight text={term.term} query={query} />
        </h3>
        <p className="term-card__definition">
          <Highlight text={term.definition} query={query} />
        </p>

        <footer className="term-card__footer">
          <StatusBadge status={status} />
          <span className="term-card__meta">
            <TierBadge tier={term.tier} short />
            {entry?.dueAt ? <span>{formatRelativeDue(entry.dueAt)}</span> : null}
          </span>
        </footer>
      </Link>
      <BookmarkButton termId={term.id} className="term-card__bookmark" />
      <span className="term-card__arrow" aria-hidden="true">
        <ArrowUpRight size={17} />
      </span>
    </article>
  )
}
