import { Link } from 'react-router-dom'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="Lexicon home">
      <span className="brand__mark" aria-hidden="true">
        <span>L</span>
        <i />
      </span>
      <span className="brand__text">
        <strong>Lexicon</strong>
        {!compact ? <small>tech vocabulary</small> : null}
      </span>
    </Link>
  )
}
