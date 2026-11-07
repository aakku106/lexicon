import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Scale, Search, Sparkles, X } from 'lucide-react'
import { DISTINCTIONS } from '../data/distinctions'
import { normalize } from '../lib/search'
import { DistinctionCard } from '../components/terms/DistinctionCard'
import { EmptyState } from '../components/ui/EmptyState'

export function DistinctionsPage() {
  const { hash } = useLocation()
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('All')

  const topics = useMemo(
    () => [...new Set(DISTINCTIONS.map((distinction) => distinction.topic))],
    [],
  )

  const results = useMemo(() => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean)
    return DISTINCTIONS.filter((distinction) => {
      if (topic !== 'All' && distinction.topic !== topic) return false
      if (tokens.length === 0) return true
      const haystack = normalize(
        [
          distinction.title,
          distinction.topic,
          distinction.summary,
          distinction.rule,
          ...distinction.items.flatMap((item) => [item.label, item.text, item.term ?? '']),
        ].join(' '),
      )
      return tokens.every((token) => haystack.includes(token))
    })
  }, [query, topic])

  const targetId = hash.replace(/^#/, '')

  useEffect(() => {
    if (!targetId) return
    const timer = window.setTimeout(() => {
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 120)
    return () => window.clearTimeout(timer)
  }, [targetId])

  const activeFilter = query.trim().length > 0 || topic !== 'All'

  return (
    <div className="distinctions-page">
      <header className="page-heading distinctions-heading">
        <p className="eyebrow">The distinction desk</p>
        <div className="page-heading__row">
          <div>
            <h1>Words that sit close together.</h1>
            <p>
              The pairs and triples that get flattened into one vague explanation. Each card
              isolates the mechanism, the boundary, and the sentence that makes the difference
              explicit.
            </p>
          </div>
          <div className="page-heading__stat">
            <strong>{DISTINCTIONS.length}</strong>
            <span>distinctions</span>
          </div>
        </div>
      </header>

      <section className="distinctions-toolbar" aria-label="Filter distinctions">
        <div className="search-field distinctions-search">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a confusion — “sharding”, “readiness”, “mock”…"
            aria-label="Search distinctions"
          />
          {query ? (
            <button
              type="button"
              className="search-field__clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          ) : (
            <kbd className="search-field__hint">/</kbd>
          )}
        </div>

        <div className="distinctions-topics" role="group" aria-label="Filter by topic">
          <button
            type="button"
            className={`distinction-topic ${topic === 'All' ? 'is-active' : ''}`}
            aria-pressed={topic === 'All'}
            onClick={() => setTopic('All')}
          >
            All
            <span>{DISTINCTIONS.length}</span>
          </button>
          {topics.map((item) => {
            const count = DISTINCTIONS.filter((distinction) => distinction.topic === item).length
            return (
              <button
                type="button"
                key={item}
                className={`distinction-topic ${topic === item ? 'is-active' : ''}`}
                aria-pressed={topic === item}
                onClick={() => setTopic(item)}
              >
                {item}
                <span>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="distinctions-results-bar" aria-live="polite">
          <p>
            <strong>{results.length}</strong> distinction{results.length === 1 ? '' : 's'}
            {topic !== 'All' ? <> in {topic}</> : null}
            {query.trim() ? <> matching “{query.trim()}”</> : null}
          </p>
          {activeFilter ? (
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setQuery('')
                setTopic('All')
              }}
            >
              Clear filters <X size={13} />
            </button>
          ) : (
            <span>Open any linked term to go deeper</span>
          )}
        </div>
      </section>

      {results.length > 0 ? (
        <div className="distinctions-grid">
          {results.map((distinction) => (
            <div
              id={distinction.id}
              key={distinction.id}
              className={`distinction-anchor ${targetId === distinction.id ? 'is-target' : ''}`}
            >
              <DistinctionCard distinction={distinction} query={query} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Scale}
          title="No distinction matches that search."
          message="Try a broader word, clear the topic filter, or search for the mechanism itself — “consensus”, “cache”, “test double”."
          action={
            <button
              type="button"
              className="button button--primary button--small"
              onClick={() => {
                setQuery('')
                setTopic('All')
              }}
            >
              Show all distinctions
            </button>
          }
        />
      )}

      <section className="distinctions-footer-card">
        <div className="distinctions-footer-card__icon">
          <Sparkles size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">A study habit</p>
          <h2>If two words feel interchangeable, you have found a gap.</h2>
          <p>
            Write the contrast as a single sentence: <em>“X does ___, while Y does ___.”</em> If
            the sentence collapses, the definitions are still fused. Open each term, read the
            precise definition, and say the distinction aloud before the next flashcard.
          </p>
        </div>
        <Link to="/flashcards?mode=trouble" className="button button--ghost button--small">
          Drill weak terms <ArrowRight size={15} />
        </Link>
      </section>

      <footer className="page-footer">
        <span>{DISTINCTIONS.length} distinctions across {topics.length} topics</span>
        <span>Every card links back into the vocabulary library</span>
      </footer>
    </div>
  )
}
