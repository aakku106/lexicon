import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, BookOpen, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { useStudy } from '../context/StudyProvider'
import { TERMS, TERMS_ALPHABETICAL } from '../data/catalog'
import { CATEGORIES } from '../data/categories'
import type { CategoryId, Tier } from '../types'
import type { SortMode, StatusFilter, TermFilters } from '../lib/search'
import { filterTerms } from '../lib/search'
import { TermCard } from '../components/terms/TermCard'
import { EmptyState } from '../components/ui/EmptyState'

const PAGE_SIZE = 30

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'learning', label: 'Learning' },
  { value: 'known', label: 'Known' },
  { value: 'bookmarked', label: 'Bookmarked' },
  { value: 'trouble', label: 'Trouble spots' },
]

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
  { value: 'category', label: 'By field' },
  { value: 'weakest', label: 'Weakest first' },
]

function validCategory(value: string | null): CategoryId | 'all' {
  if (!value) return 'all'
  return CATEGORIES.some((category) => category.id === value) ? (value as CategoryId) : 'all'
}

function validTier(value: string | null): Tier | 'all' {
  if (value === '1') return 1
  if (value === '2') return 2
  if (value === '3') return 3
  return 'all'
}

function validStatus(value: string | null): StatusFilter {
  return STATUS_OPTIONS.some((option) => option.value === value) ? (value as StatusFilter) : 'all'
}

function validSort(value: string | null): SortMode {
  return SORT_OPTIONS.some((option) => option.value === value) ? (value as SortMode) : 'az'
}

export function LibraryPage() {
  const { progress, bookmarks } = useStudy()
  const [searchParams, setSearchParams] = useSearchParams()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filters: TermFilters = {
    query: searchParams.get('q') ?? '',
    category: validCategory(searchParams.get('category')),
    tier: validTier(searchParams.get('tier')),
    status: validStatus(searchParams.get('status')),
    sort: validSort(searchParams.get('sort')),
  }

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'all' || value === 'az') next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filters.query, filters.category, filters.tier, filters.status, filters.sort])

  const results = useMemo(
    () => filterTerms(TERMS_ALPHABETICAL, filters, progress, bookmarks),
    [TERMS_ALPHABETICAL, filters.query, filters.category, filters.tier, filters.status, filters.sort, progress, bookmarks],
  )

  const shown = results.slice(0, visibleCount)
  const activeFilterCount =
    (filters.query ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0) +
    (filters.tier !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.sort !== 'az' ? 1 : 0)

  function clearFilters() {
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="library-page">
      <header className="page-heading">
        <p className="eyebrow">The library</p>
        <div className="page-heading__row">
          <div>
            <h1>One shared language for the whole stack.</h1>
            <p>
              {TERMS.length} terms across {CATEGORIES.length} fields — each with a precise
              definition, why it matters, and the vocabulary to say it clearly.
            </p>
          </div>
          <div className="page-heading__stat">
            <strong>{TERMS.length}</strong>
            <span>definitions</span>
          </div>
        </div>
      </header>

      <section className="library-controls" aria-label="Filter the vocabulary library">
        <div className="search-field search-field--large">
          <Search size={20} aria-hidden="true" />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => updateParam('q', event.target.value)}
            placeholder="Search terms, definitions, aliases…"
            aria-label="Search terms and definitions"
          />
          {filters.query ? (
            <button type="button" className="search-field__clear" onClick={() => updateParam('q', null)} aria-label="Clear search">
              <X size={17} />
            </button>
          ) : (
            <kbd className="search-field__hint">/</kbd>
          )}
        </div>

        <div className="library-filter-row">
          <label className="select-field">
            <span className="select-field__label">Field</span>
            <span className="select-field__control">
              <select
                value={filters.category}
                onChange={(event) => updateParam('category', event.target.value)}
              >
                <option value="all">All fields</option>
                {CATEGORIES.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </span>
          </label>

          <label className="select-field">
            <span className="select-field__label">Priority</span>
            <span className="select-field__control">
              <select
                value={filters.tier === 'all' ? 'all' : String(filters.tier)}
                onChange={(event) => updateParam('tier', event.target.value)}
              >
                <option value="all">All tiers</option>
                <option value="1">Tier 1 · essentials</option>
                <option value="2">Tier 2 · backend</option>
                <option value="3">Tier 3 · deeper systems</option>
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </span>
          </label>

          <label className="select-field">
            <span className="select-field__label">Sort</span>
            <span className="select-field__control">
              <select
                value={filters.sort}
                onChange={(event) => updateParam('sort', event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </span>
          </label>

          {activeFilterCount > 0 ? (
            <button type="button" className="button button--ghost button--small clear-filters" onClick={clearFilters}>
              <X size={14} /> Clear filters
            </button>
          ) : null}
        </div>

        <div className="status-chips" role="group" aria-label="Filter by learning status">
          <SlidersHorizontal size={15} aria-hidden="true" className="status-chips__icon" />
          {STATUS_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`chip ${filters.status === option.value ? 'is-active' : ''}`}
              aria-pressed={filters.status === option.value}
              onClick={() => updateParam('status', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <div className="library-results-bar">
        <p>
          <strong>{results.length}</strong> term{results.length === 1 ? '' : 's'}
          {filters.query ? <> matching “{filters.query}”</> : null}
          {filters.category !== 'all' ? <> in {CATEGORIES.find((category) => category.id === filters.category)?.shortName}</> : null}
        </p>
        <span>Showing {Math.min(visibleCount, results.length)} of {results.length}</span>
      </div>

      {shown.length > 0 ? (
        <>
          <div className="term-grid">
            {shown.map((term, index) => (
              <TermCard key={term.id} term={term} query={filters.query} index={index} />
            ))}
          </div>
          {visibleCount < results.length ? (
            <div className="load-more">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Load {Math.min(PAGE_SIZE, results.length - visibleCount)} more
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <span>{results.length - visibleCount} remaining</span>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No terms match those filters."
          message="Try a broader search, clear the status filter, or explore another field. The vocabulary is a map, not a maze."
          action={
            <button type="button" className="button button--primary button--small" onClick={clearFilters}>
              Clear all filters
            </button>
          }
        />
      )}

      <footer className="page-footer">
        <span>{CATEGORIES.length} fields · {TERMS.length} terms · local-first</span>
        <span>Use <kbd>⌘K</kbd> or <kbd>/</kbd> anywhere to search</span>
      </footer>
    </div>
  )
}
