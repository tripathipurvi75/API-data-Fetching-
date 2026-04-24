import React, { useState } from 'react'

// ─── Card Component ───────────────────────────────────────────────────────────
// Displays a single TV show with image, name, genres, rating, and summary.
// Props:
//   show  – the show object from TVMaze API
//   dark  – boolean for dark mode styling
// ─────────────────────────────────────────────────────────────────────────────
function Card({ show, dark }) {
  // Track whether the full summary is expanded
  const [expanded, setExpanded] = useState(false)

  // Some shows may not have an image — use a placeholder if missing
  const imageUrl = show.image
    ? show.image.medium
    : 'https://via.placeholder.com/210x295?text=No+Image'

  // Strip HTML tags from summary text (API returns HTML)
  const rawSummary = show.summary || '<p>No summary available.</p>'
  const cleanSummary = rawSummary.replace(/<[^>]+>/g, '')

  // Shorten summary for collapsed state
  const shortSummary =
    cleanSummary.length > 120 ? cleanSummary.slice(0, 120) + '...' : cleanSummary

  // Rating out of 10 → display as stars or number
  const rating = show.rating?.average ?? 'N/A'

  // Genres array (may be empty)
  const genres = show.genres?.length > 0 ? show.genres : ['Unknown']

  return (
    <div className={`card ${dark ? 'card--dark' : ''}`}>
      {/* ── Poster Image ── */}
      <div className="card__img-wrap">
        <img
          src={imageUrl}
          alt={show.name}
          className="card__img"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/210x295?text=No+Image'
          }}
        />
        {/* Rating badge over image */}
        <span className="card__badge">
          ⭐ {rating !== 'N/A' ? Number(rating).toFixed(1) : 'N/A'}
        </span>
        {/* Network badge */}
        {show.network?.name && (
          <span className="card__network">{show.network.name}</span>
        )}
      </div>

      {/* ── Card Body ── */}
      <div className="card__body">
        <h3 className="card__title">{show.name}</h3>

        {/* Genres */}
        <div className="card__genres">
          {genres.map((g) => (
            <span key={g} className="card__genre-tag">
              {g}
            </span>
          ))}
        </div>

        {/* Status & Language */}
        <div className="card__meta">
          <span className={`card__status card__status--${(show.status || 'unknown').toLowerCase().replace(/\s/g, '-')}`}>
            {show.status || 'Unknown'}
          </span>
          {show.language && <span className="card__lang">🌐 {show.language}</span>}
        </div>

        {/* Summary */}
        <p className="card__summary">
          {expanded ? cleanSummary : shortSummary}
        </p>
        {cleanSummary.length > 120 && (
          <button
            className="card__toggle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show Less ▲' : 'Read More ▼'}
          </button>
        )}
      </div>
    </div>
  )
}

export default Card
