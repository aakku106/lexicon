import type { TermProgress, Tier } from '../../types'
import { TIER_META } from '../../data/categories'

export function StatusBadge({ status }: { status: TermProgress['status'] }) {
  const label = status === 'new' ? 'New' : status === 'learning' ? 'Learning' : 'Known'
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {label}
    </span>
  )
}

export function TierBadge({ tier, short = false }: { tier?: Tier; short?: boolean }) {
  if (!tier) return null
  return (
    <span
      className={`tier-badge tier-badge--${tier}`}
      title={`${TIER_META[tier].label}: ${TIER_META[tier].title}`}
    >
      {short ? `T${tier}` : TIER_META[tier].label}
    </span>
  )
}
