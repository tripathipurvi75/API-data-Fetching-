import React, { useState, useEffect, useMemo } from 'react'
import Card from './components/Card.jsx'

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = 'https://api.tvmaze.com/shows'
const ITEMS_PER_PAGE = 12

// ─── App Component ────────────────────────────────────────────────────────────
// Root component. Manages all state and renders the full UI.
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  // ── Core data state ──
  const [shows, setShows] = useState([])         // All fetched shows
  const [loading, setLoading] = useState(false)   // Loading indicator
  const [error, setError] = useState(null)         // Error message

  // ── UI / filter state ──
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [sortOption, setSortOption] = useState('default')  // 'default' | 'name-asc' | 'name-desc' | 'rating-high' | 'rating-low'
  const [currentPage, setCurrentPage] = useState(1)
  const [hasLoaded, setHasLoaded] = useState(false)  // Have we fetched at least once?

  // ── Fetch data from TVMaze API ──
  // Uses the fetch() API (no axios needed).
  // Sets loading → fetches → stores data or error → unsets loading.
  const fetchShows = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(API_URL)

      // If server returned a non-OK status (4xx / 5xx), throw an error
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setShows(data)
      setHasLoaded(true)
      setCurrentPage(1) // reset to first page on fresh fetch
    } catch (err) {
      // Network failure or JSON parse error
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Auto-fetch on first mount ──
  useEffect(() => {
    fetchShows()
  }, []) // empty dependency array → runs once on mount

  // ── Collect all unique genres from loaded shows ──
  const allGenres = useMemo(() => {
    const genreSet = new Set()
    shows.forEach((s) => s.genres?.forEach((g) => genreSet.add(g)))
    return ['All', ...Array.from(genreSet).sort()]
  }, [shows])

  // ── Apply search, genre filter, and sort ──
  const filteredAndSorted = useMemo(() => {
    let result = [...shows]

    // 1. Search by name
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      result = result.filter((s) => s.name.toLowerCase().includes(q))
    }

    // 2. Genre filter
    if (selectedGenre !== 'All') {
      result = result.filter((s) => s.genres?.includes(selectedGenre))
    }

    // 3. Sorting
    if (sortOption === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortOption === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name))
    } else if (sortOption === 'rating-high') {
      result.sort((a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0))
    } else if (sortOption === 'rating-low') {
      result.sort((a, b) => (a.rating?.average ?? 0) - (b.rating?.average ?? 0))
    }

    return result
  }, [shows, searchQuery, selectedGenre, sortOption])

  // ── Pagination: slice the filtered list ──
  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE)
  const paginatedShows = filteredAndSorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to page 1 whenever filters / search change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGenre, sortOption])

  // ── Pagination helpers ──
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Build page numbers array (show max 5 buttons)
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = []
    const half = 2
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, currentPage + half)
    if (currentPage <= half + 1) { start = 1; end = 5 }
    if (currentPage >= totalPages - half) { start = totalPages - 4; end = totalPages }
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`app ${darkMode ? 'app--dark' : ''}`}>

      {/* ════════ HEADER ════════ */}
      <header className="header">
        <div className="header__inner">
          <div className="header__brand">
            <span className="header__logo">📺</span>
            <div>
              <h1 className="header__title">TV Shows Explorer</h1>
              <p className="header__subtitle">Discover · Search · Explore</p>
            </div>
          </div>

          <div className="header__actions">
            {/* Refresh button */}
            <button
              className="btn btn--outline"
              onClick={fetchShows}
              disabled={loading}
              title="Refresh data"
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>

            {/* Dark mode toggle */}
            <button
              className={`btn btn--icon ${darkMode ? 'btn--active' : ''}`}
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {hasLoaded && !loading && (
          <div className="header__stats">
            <span>📊 {shows.length} total shows</span>
            <span>🔍 {filteredAndSorted.length} matching</span>
            <span>📄 Page {currentPage} of {totalPages || 1}</span>
          </div>
        )}
      </header>

      {/* ════════ CONTROLS BAR ════════ */}
      <section className="controls">
        {/* Search */}
        <div className="controls__search">
          <span className="controls__search-icon">🔍</span>
          <input
            type="text"
            className="controls__input"
            placeholder="Search shows by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="controls__clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        {/* Genre filter */}
        <select
          className="controls__select"
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
        >
          {allGenres.map((g) => (
            <option key={g} value={g}>{g === 'All' ? '🎭 All Genres' : g}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          className="controls__select"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="default">📋 Default Order</option>
          <option value="name-asc">🔤 Name A → Z</option>
          <option value="name-desc">🔤 Name Z → A</option>
          <option value="rating-high">⭐ Rating High → Low</option>
          <option value="rating-low">⭐ Rating Low → High</option>
        </select>
      </section>

      {/* ════════ MAIN CONTENT ════════ */}
      <main className="main">

        {/* ── Loading State ── */}
        {loading && (
          <div className="status-box">
            <div className="spinner"></div>
            <p className="status-box__text">Fetching shows from TVMaze API...</p>
            <p className="status-box__sub">Please wait a moment ✨</p>
          </div>
        )}

        {/* ── Error State ── */}
        {!loading && error && (
          <div className="status-box status-box--error">
            <span className="status-box__icon">⚠️</span>
            <p className="status-box__text">Oops! Something went wrong.</p>
            <p className="status-box__sub">{error}</p>
            <button className="btn btn--primary" onClick={fetchShows}>
              Try Again
            </button>
          </div>
        )}

        {/* ── Empty Search Result ── */}
        {!loading && !error && hasLoaded && filteredAndSorted.length === 0 && (
          <div className="status-box">
            <span className="status-box__icon">🔎</span>
            <p className="status-box__text">No shows found</p>
            <p className="status-box__sub">
              Try a different search or genre filter.
            </p>
            <button
              className="btn btn--outline"
              onClick={() => { setSearchQuery(''); setSelectedGenre('All') }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* ── Cards Grid ── */}
        {!loading && !error && paginatedShows.length > 0 && (
          <div className="grid">
            {/* map() renders one Card per show */}
            {paginatedShows.map((show) => (
              <Card key={show.id} show={show} dark={darkMode} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination__btn"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            <button
              className="pagination__btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ‹
            </button>

            {getPageNumbers().map((page) => (
              <button
                key={page}
                className={`pagination__btn ${page === currentPage ? 'pagination__btn--active' : ''}`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="pagination__btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
            <button
              className="pagination__btn"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        )}
      </main>

      {/* ════════ FOOTER ════════ */}
      <footer className="footer">
        <p>
          Built with ⚛️ React + Vite &nbsp;|&nbsp; Data from{' '}
          <a href="https://www.tvmaze.com/api" target="_blank" rel="noreferrer">
            TVMaze API
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
