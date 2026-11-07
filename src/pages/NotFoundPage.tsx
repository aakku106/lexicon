import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Compass, Search } from 'lucide-react'
import { TERMS } from '../data/catalog'
import { openSearch } from '../components/layout/nav'

export function NotFoundPage() {
  return (
    <div className="notfound-page">
      <span className="notfound-page__code" aria-hidden="true">404</span>
      <span className="notfound-page__icon"><Compass size={24} /></span>
      <p className="eyebrow">Off the map</p>
      <h1>That page is not in the lexicon.</h1>
      <p>
        The link may be out of date, or the word may still be waiting to be named. There are
        {' '}{TERMS.length} terms and 19 fields one step away.
      </p>
      <div className="notfound-page__actions">
        <Link to="/" className="button button--primary">
          <ArrowLeft size={16} /> Back home
        </Link>
        <Link to="/library" className="button button--ghost">
          Browse the library <ArrowRight size={16} />
        </Link>
        <button type="button" className="button button--ghost" onClick={openSearch}>
          <Search size={16} /> Search
        </button>
      </div>
      <div className="notfound-page__links">
        <Link to="/library?tier=1">Tier 1 essentials</Link>
        <Link to="/distinctions">Common confusions</Link>
        <Link to="/flashcards">Flashcards</Link>
        <Link to="/progress">Your progress</Link>
      </div>
    </div>
  )
}
