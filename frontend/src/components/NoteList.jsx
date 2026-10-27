// ==============================================================================
// LAYER: Frontend Component Layer (NoteList UI & Search Sidebar)
// Description: Renders the left-hand sidebar containing search input,
//              new note trigger button, list of note cards with pinned badges,
//              color tag indicators, and quick delete confirmation.
// ==============================================================================

import React from 'react';

/**
 * Maps color tag keys to user-friendly label names.
 */
const COLOR_LABELS = {
  default: 'Slate',
  amber: 'Amber',
  emerald: 'Mint',
  indigo: 'Indigo',
  rose: 'Blush',
  purple: 'Lavender',
  sky: 'Sky',
};

/**
 * Formats ISO date string into human-friendly relative or short format.
 */
function formatNoteDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNewNote,
  searchQuery,
  onSearchChange,
  onTogglePin,
  onPromptDelete,
}) {
  return (
    <aside className="note-list-sidebar" aria-label="Notes navigation">
      {/* Sidebar Header: App Title, Note Counter, and + New Note Button */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon" aria-hidden="true">📝</div>
          <div>
            <h1 className="brand-title">Personal Notes</h1>
            <p className="brand-subtitle">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'} stored
            </p>
          </div>
        </div>
        <button
          id="btn-new-note"
          className="btn-create-note"
          onClick={onCreateNewNote}
          title="Create a new note (Alt+N)"
        >
          <span className="btn-icon">＋</span>
          <span>New Note</span>
        </button>
      </div>

      {/* Search Filter Box */}
      <div className="search-box-container">
        <div className="search-input-wrapper">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            id="note-search-input"
            type="text"
            className="search-input"
            placeholder="Search title or content..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search notes by title or content"
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              title="Clear search query"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Notes List Container */}
      <div className="notes-scroll-container">
        {notes.length === 0 ? (
          <div className="empty-search-state">
            <span className="empty-state-icon">🔎</span>
            <p className="empty-state-title">
              {searchQuery ? 'No matching notes found' : 'No notes yet'}
            </p>
            <p className="empty-state-desc">
              {searchQuery
                ? `No notes match "${searchQuery}". Try a different keyword.`
                : 'Click "+ New Note" above to write your very first note!'}
            </p>
            {searchQuery && (
              <button
                className="btn-clear-filter"
                onClick={() => onSearchChange('')}
              >
                Clear Filter
              </button>
            )}
          </div>
        ) : (
          <ul className="notes-list" role="listbox" aria-label="List of notes">
            {notes.map((note) => {
              const isSelected = note.id === selectedNoteId;
              const noteColor = note.color || 'default';

              return (
                <li
                  key={note.id}
                  id={`note-item-${note.id}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`note-card note-color-${noteColor} ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectNote(note.id)}
                >
                  <div className="note-card-header">
                    <h3 className="note-card-title">
                      {note.title || 'Untitled Note'}
                    </h3>

                    {/* Quick Pin Toggle Button */}
                    <button
                      type="button"
                      className={`pin-badge-btn ${note.is_pinned ? 'is-pinned' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(note);
                      }}
                      title={note.is_pinned ? 'Unpin note' : 'Pin note to top'}
                      aria-label={note.is_pinned ? 'Unpin note' : 'Pin note to top'}
                    >
                      {note.is_pinned ? '📌' : '📍'}
                    </button>
                  </div>

                  {/* Note Content Preview snippet */}
                  <p className="note-card-preview">
                    {note.content && note.content.trim()
                      ? note.content.trim().slice(0, 80) + (note.content.length > 80 ? '...' : '')
                      : '(No additional text)'}
                  </p>

                  {/* Note Card Footer: Timestamp, Color Tag, and Delete action */}
                  <div className="note-card-footer">
                    <span className="note-card-date" title={`Last updated: ${new Date(note.updated_at).toLocaleString()}`}>
                      {formatNoteDate(note.updated_at)}
                    </span>

                    <div className="note-card-actions">
                      <span className={`color-pill pill-${noteColor}`} title={`Tag: ${COLOR_LABELS[noteColor] || 'Default'}`}>
                        {COLOR_LABELS[noteColor] || 'Note'}
                      </span>

                      {/* Quick Delete Button */}
                      <button
                        type="button"
                        className="btn-quick-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPromptDelete(note);
                        }}
                        title="Delete note"
                        aria-label={`Delete note "${note.title}"`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
