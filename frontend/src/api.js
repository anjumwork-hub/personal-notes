// ==============================================================================
// LAYER: Frontend API Client Layer
// Description: Centralized service module providing asynchronous HTTP fetch functions
//              to interact with the FastAPI backend (http://localhost:8000).
// ==============================================================================

// Base URL for the FastAPI backend server
const API_BASE_URL = 'http://localhost:8000';

/**
 * Helper function to handle response errors consistently across all API calls.
 * Parses backend JSON error response or falls back to status text.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // Ignore JSON parse failure and use fallback error message
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * Retrieves notes from the backend, with optional search filtering by title or content.
 *
 * @param {string} search - Search query string
 * @returns {Promise<Array>} Array of Note objects sorted by pinned and updated_at
 */
export async function getNotes(search = '') {
  // Construct search query parameter if provided
  const queryParam = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  const response = await fetch(`${API_BASE_URL}/api/notes${queryParam}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  return handleResponse(response);
}

/**
 * Creates a new note in the database.
 *
 * @param {Object} noteData - Note payload ({ title, content, is_pinned, color })
 * @returns {Promise<Object>} Newly created Note object with database ID
 */
export async function createNote(noteData) {
  const response = await fetch(`${API_BASE_URL}/api/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(noteData),
  });
  return handleResponse(response);
}

/**
 * Updates an existing note by ID.
 *
 * @param {number} id - Note ID to update
 * @param {Object} noteData - Partial or full note fields to update
 * @returns {Promise<Object>} Updated Note object
 */
export async function updateNote(id, noteData) {
  const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(noteData),
  });
  return handleResponse(response);
}

/**
 * Deletes a note by ID.
 *
 * @param {number} id - Note ID to delete
 * @returns {Promise<Object>} Deletion confirmation response
 */
export async function deleteNote(id) {
  const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
    },
  });
  return handleResponse(response);
}
