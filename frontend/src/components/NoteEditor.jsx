// ==============================================================================
// LAYER: Frontend Component Layer (NoteEditor UI & Note Management)
// Description: Renders the right-hand editing panel for viewing, composing,
//              updating, color-coding, pinning, saving, and deleting the active note.
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';

/**
 * Color options available for user selection.
 */
const COLOR_OPTIONS = [
  { id: 'default', label: 'Default', hex: '#64748b' },
  { id: 'amber', label: 'Amber', hex: '#d97706' },
  { id: 'emerald', label: 'Mint', hex: '#059669' },
  { id: 'indigo', label: 'Indigo', hex: '#4f46e5' },
  { id: 'rose', label: 'Blush', hex: '#e11d48' },
  { id: 'purple', label: 'Lavender', hex: '#7c3aed' },
  { id: 'sky', label: 'Sky', hex: '#0284c7' },
];

export default function NoteEditor({
  selectedNote,
  isDraftingNew,
  onSaveNote,
  onPromptDelete,
  onCreateNewNote,
  isSaving,
}) {
  // Local state for the editable fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState('default');
  const [validationError, setValidationError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Reference to title input for auto-focusing on creation
  const titleInputRef = useRef(null);

  // Sync editor fields whenever the selected note changes or a new draft is started
  useEffect(() => {
    if (isDraftingNew) {
      setTitle('');
      setContent('');
      setIsPinned(false);
      setColor('default');
      setValidationError('');
      setIsDirty(false);
      // Auto-focus the title input when drafting a new note
      setTimeout(() => titleInputRef.current?.focus(), 50);
    } else if (selectedNote) {
      setTitle(selectedNote.title || '');
      setContent(selectedNote.content || '');
      setIsPinned(Boolean(selectedNote.is_pinned));
      setColor(selectedNote.color || 'default');
      setValidationError('');
      setIsDirty(false);
    }
  }, [selectedNote, isDraftingNew]);

  // Support Ctrl+S / Cmd+S shortcut to quickly save changes
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Handle title input change
  function handleTitleChange(e) {
    setTitle(e.target.value);
    setIsDirty(true);
    if (validationError && e.target.value.trim()) {
      setValidationError('');
    }
  }

  // Handle content textarea change
  function handleContentChange(e) {
    setContent(e.target.value);
    setIsDirty(true);
  }

  // Handle color change
  function handleColorChange(newColor) {
    setColor(newColor);
    setIsDirty(true);
  }

  // Handle pin toggle
  function handlePinToggle() {
    setIsPinned(!isPinned);
    setIsDirty(true);
  }

  // Validate inputs and trigger save
  function handleSubmit(e) {
    if (e) e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Note title is required and cannot be empty.');
      titleInputRef.current?.focus();
      return;
    }

    setValidationError('');
    onSaveNote({
      id: isDraftingNew ? null : selectedNote?.id,
      title: trimmedTitle,
      content,
      is_pinned: isPinned,
      color,
    });
    setIsDirty(false);
  }

  // Empty state when no note is selected and not drafting a new note
  if (!selectedNote && !isDraftingNew) {
    return (
      <main className="note-editor-panel empty-selection" aria-label="Note editor empty state">
        <div className="empty-editor-content">
          <div className="empty-editor-illustration">📄</div>
          <h2 className="empty-editor-heading">No Note Selected</h2>
          <p className="empty-editor-instruction">
            Choose a note from the left sidebar to read and edit its contents, or click below to start a new one.
          </p>
          <button
            id="btn-empty-create"
            className="btn-create-note-hero"
            onClick={onCreateNewNote}
          >
            <span className="btn-icon">＋</span> Create a New Note
          </button>
        </div>
      </main>
    );
  }

  // Character and word counts
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <main className={`note-editor-panel editor-color-${color}`} aria-label="Note editor">
      {/* Editor Header Bar with actions, status badges, and color tags */}
      <div className="editor-top-bar">
        <div className="top-bar-left">
          {/* Mode Badge: New Draft vs. Editing ID */}
          <span className={`status-pill ${isDraftingNew ? 'pill-draft' : 'pill-active'}`}>
            {isDraftingNew ? '✨ New Note' : `Editing #${selectedNote?.id}`}
          </span>

          {/* Dirty state / Unsaved indicator */}
          {isDirty && (
            <span className="dirty-indicator" title="You have unsaved changes (Press Ctrl+S to save)">
              ● Unsaved changes
            </span>
          )}

          {/* Saved timestamp */}
          {!isDraftingNew && selectedNote?.updated_at && !isDirty && (
            <span className="timestamp-indicator">
              Saved {new Date(selectedNote.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="top-bar-right">
          {/* Stretch Goal: Pin Toggle Button */}
          <button
            type="button"
            id="btn-toggle-pin"
            className={`btn-action-pin ${isPinned ? 'active' : ''}`}
            onClick={handlePinToggle}
            title={isPinned ? 'Note is pinned to top (click to unpin)' : 'Pin note to top of list'}
          >
            <span className="pin-symbol">{isPinned ? '📌' : '📍'}</span>
            <span>{isPinned ? 'Pinned' : 'Pin'}</span>
          </button>

          {/* Delete Button (Only available for existing notes) */}
          {!isDraftingNew && selectedNote && (
            <button
              type="button"
              id="btn-delete-note"
              className="btn-action-delete"
              onClick={() => onPromptDelete(selectedNote)}
              title="Delete this note (Confirm dialog will appear)"
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          )}

          {/* Save / Create Note Button */}
          <button
            type="button"
            id="btn-save-note"
            className="btn-action-save"
            onClick={handleSubmit}
            disabled={isSaving}
            title="Save changes (Ctrl+S)"
          >
            <span>{isSaving ? '⏳' : '💾'}</span>
            <span>{isSaving ? 'Saving...' : isDraftingNew ? 'Create Note' : 'Save Note'}</span>
          </button>
        </div>
      </div>

      {/* Stretch Goal: Color Picker Bar */}
      <div className="color-selector-bar">
        <span className="color-bar-label">Color Tag:</span>
        <div className="color-options-group" role="radiogroup" aria-label="Color tag options">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={color === c.id}
              className={`color-dot-btn ${color === c.id ? 'active' : ''}`}
              style={{ backgroundColor: c.hex }}
              onClick={() => handleColorChange(c.id)}
              title={`${c.label} color tag`}
            >
              {color === c.id && <span className="checkmark">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="validation-alert" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{validationError}</span>
        </div>
      )}

      {/* Note Input Fields (Title and Content) */}
      <div className="editor-fields-container">
        <div className="title-field-group">
          <input
            id="note-title-input"
            ref={titleInputRef}
            type="text"
            className="note-title-input"
            placeholder="Note Title..."
            value={title}
            onChange={handleTitleChange}
            maxLength={200}
            aria-label="Note Title"
          />
        </div>

        <div className="content-field-group">
          <textarea
            id="note-content-textarea"
            className="note-content-textarea"
            placeholder="Write your note content here..."
            value={content}
            onChange={handleContentChange}
            aria-label="Note Content"
          />
        </div>
      </div>

      {/* Editor Footer: Word Count, Char Count, and Shortcuts Hint */}
      <div className="editor-footer">
        <div className="footer-stats">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span className="stat-separator">•</span>
          <span>{charCount} {charCount === 1 ? 'character' : 'characters'}</span>
        </div>
        <div className="footer-shortcuts">
          <kbd>Ctrl+S</kbd> to save
        </div>
      </div>
    </main>
  );
}
