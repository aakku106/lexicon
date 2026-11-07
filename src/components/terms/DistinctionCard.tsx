import { Link } from 'react-router-dom'
import { ArrowUpRight, Lightbulb } from 'lucide-react'
import type { Distinction } from '../../types'
import { findTermByName } from '../../data/catalog'
import { Highlight } from '../ui/Highlight'

export function DistinctionCard({ distinction, query = '' }: { distinction: Distinction; query?: string }) {
  return (
    <article className="distinction-card">
      <header>
        <span className="eyebrow">{distinction.topic}</span>
        <h3>
          <Highlight text={distinction.title} query={query} />
        </h3>
        <p className="distinction-card__summary">
          <Highlight text={distinction.summary} query={query} />
        </p>
      </header>

      <div className="distinction-card__items">
        {distinction.items.map((item) => {
          const linkedTerm = item.term ? findTermByName(item.term) : undefined
          return (
            <div className="distinction-item" key={`${distinction.id}-${item.label}`}>
              <div className="distinction-item__head">
                <span className="distinction-item__label">{item.label}</span>
                {linkedTerm ? (
                  <Link to={`/terms/${linkedTerm.id}`} className="distinction-item__link">
                    {linkedTerm.term}
                    <ArrowUpRight size={12} aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
              <p>
                <Highlight text={item.text} query={query} />
              </p>
            </div>
          )
        })}
      </div>

      <div className="distinction-card__rule">
        <Lightbulb size={16} aria-hidden="true" />
        <p>
          <strong>Quick rule:</strong> <Highlight text={distinction.rule} query={query} />
        </p>
      </div>
    </article>
  )
}
