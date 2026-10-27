// ==============================================================================
// LAYER: Frontend Application Root (React Hooks & State Orchestration)
// Description: Main application component managing state for notes list, active selection,
//              search queries, delete confirmation modal, and communication with the API.
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import { getNotes, createNote, updateNote, deleteNote } from './api';

export default function App() {
  // State for all notes returned by backend
  const [notes, setNotes] = useState([]);

  // ID of the currently active note in the editor (or null)
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  // Flag indicating whether the user is currently composing a brand new note
  const [isDraftingNew, setIsDraftingNew] = useState(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Toast notification state ({ message, type: 'success' | 'info' | 'error' })
  const [toast, setToast] = useState(null);

  // Confirm delete modal state (null when closed, note object when open)
  const [noteToDelete, setNoteToDelete] = useState(null);

  /**
   * Helper function to show temporary toast notification.
   */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  /**
   * Fetches notes from the backend with optional search filter.
   */
  const loadNotes = useCallback(async (search = '') => {
    try {
      setErrorMessage('');
      const data = await getNotes(search);
      setNotes(data);

      // If there are notes and neither an active note nor drafting mode is set, select the first note
      if (data.length > 0) {
        setSelectedNoteId((currentId) => {
          // If current selection is still in list, keep it
          const exists = data.some((n) => n.id === currentId);
          if (exists) return currentId;
          // Otherwise default to the first note (pinned notes will be first)
          return data[0].id;
        });
      } else {
        setSelectedNoteId(null);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
      setErrorMessage('Failed to connect to the backend server. Please make sure the FastAPI server is running at http://localhost:8000.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial notes on mount
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Re-fetch when search query changes (debounced by 250ms for performance)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotes(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, loadNotes]);

  /**
   * Trigger drafting of a new note in the editor.
   */
  function handleCreateNewNote() {
    setIsDraftingNew(true);
    setSelectedNoteId(null);
  }

  /**
   * Selects an existing note to view and edit.
   */
  function handleSelectNote(id) {
    setIsDraftingNew(false);
    setSelectedNoteId(id);
  }

  /**
   * Saves either a new note (POST) or updates an existing note (PUT).
   */
  async function handleSaveNote(noteData) {
    setIsSaving(true);
    try {
      if (noteData.id) {
        // Update existing note
        const updated = await updateNote(noteData.id, {
          title: noteData.title,
          content: noteData.content,
          is_pinned: noteData.is_pinned,
          color: noteData.color,
        });

        // Update local list
        setNotes((prev) =>
          prev.map((n) => (n.id === updated.id ? updated : n))
            .sort((a, b) => (b.is_pinned - a.is_pinned) || new Date(b.updated_at) - new Date(a.updated_at))
        );
        setSelectedNoteId(updated.id);
        setIsDraftingNew(false);
        showToast('Note updated successfully!');
      } else {
        // Create new note
        const created = await createNote({
          title: noteData.title,
          content: noteData.content,
          is_pinned: noteData.is_pinned,
          color: noteData.color,
        });

        // Prepend new note to list and select it
        setNotes((prev) => [
          created,
          ...prev.filter((n) => n.id !== created.id),
        ].sort((a, b) => (b.is_pinned - a.is_pinned) || new Date(b.updated_at) - new Date(a.updated_at)));

        setSelectedNoteId(created.id);
        setIsDraftingNew(false);
        showToast('New note created successfully!');
      }
    } catch (err) {
      console.error('Failed to save note:', err);
      showToast(err.message || 'Error saving note', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Toggles the pinned status of a note directly from the list.
   */
  async function handleTogglePin(note) {
    try {
      const updated = await updateNote(note.id, {
        is_pinned: !note.is_pinned,
      });

      // Update state and resort
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n))
          .sort((a, b) => (b.is_pinned - a.is_pinned) || new Date(b.updated_at) - new Date(a.updated_at))
      );

      showToast(updated.is_pinned ? 'Note pinned to top 📌' : 'Note unpinned');
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      showToast('Could not update pin status', 'error');
    }
  }

  /**
   * Prompts user with confirmation dialog before deleting.
   */
  function handlePromptDelete(note) {
    setNoteToDelete(note);
  }

  /**
   * Executes deletion of the confirmed note.
   */
  async function handleConfirmDelete() {
    if (!noteToDelete) return;

    const idToDelete = noteToDelete.id;
    try {
      await deleteNote(idToDelete);

      // Remove from state
      setNotes((prev) => {
        const remaining = prev.filter((n) => n.id !== idToDelete);
        // If the deleted note was selected, select the first remaining note or open new draft
        if (selectedNoteId === idToDelete) {
          if (remaining.length > 0) {
            setSelectedNoteId(remaining[0].id);
          } else {
            setSelectedNoteId(null);
            setIsDraftingNew(true);
          }
        }
        return remaining;
      });

      showToast('Note deleted successfully', 'info');
    } catch (err) {
      console.error('Failed to delete note:', err);
      showToast('Failed to delete note', 'error');
    } finally {
      setNoteToDelete(null);
    }
  }

  // Find the selected note object from the list
  const activeNote = notes.find((n) => n.id === selectedNoteId) || null;

  return (
    <div className="app-container">
      {/* Toast Notification Alert */}
      {toast && (
        <aside
          role="status"
          aria-live="polite"
          className={`toast-alert toast-${toast.type}`}
        >
          <span className="toast-icon">
            {toast.type === 'error' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '✅'}
          </span>
          <span className="toast-text">{toast.message}</span>
        </aside>
      )}

      {/* Backend Connection Error Banner */}
      {errorMessage && (
        <div className="connection-error-banner" role="alert">
          <div className="error-banner-content">
            <span className="error-icon">🔌</span>
            <div>
              <strong>Backend Disconnected:</strong> {errorMessage}
            </div>
          </div>
          <button
            className="btn-retry"
            onClick={() => loadNotes(searchQuery)}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="app-layout">
        {/* Left Side: Note List and Search */}
        <NoteList
          notes={notes}
          selectedNoteId={selectedNoteId}
          onSelectNote={handleSelectNote}
          onCreateNewNote={handleCreateNewNote}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onTogglePin={handleTogglePin}
          onPromptDelete={handlePromptDelete}
        />

        {/* Right Side: Note Editor */}
        <NoteEditor
          selectedNote={activeNote}
          isDraftingNew={isDraftingNew}
          onSaveNote={handleSaveNote}
          onPromptDelete={handlePromptDelete}
          onCreateNewNote={handleCreateNewNote}
          isSaving={isSaving}
        />
      </div>

      {/* Confirm Delete Modal Dialog */}
      {noteToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => setNoteToDelete(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <span className="modal-icon">🗑️</span>
              <h2 id="delete-dialog-title" className="modal-title">Delete Note</h2>
            </div>
            <p className="modal-body-text">
              Are you sure you want to delete{' '}
              <strong>"{noteToDelete.title || 'Untitled Note'}"</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-footer-actions">
              <button
                type="button"
                id="btn-cancel-delete"
                className="btn-modal-cancel"
                onClick={() => setNoteToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete"
                className="btn-modal-confirm"
                onClick={handleConfirmDelete}
              >
                Yes, Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
