# ==============================================================================
# LAYER: Backend API Layer (FastAPI REST Controller & Routes)
# Description: Implements the REST API endpoints, CORS middleware configuration,
#              lifespan hooks for database initialization, and input validation handling.
# ==============================================================================

import sys
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query, status, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

# Ensure the backend directory is in the Python search path for local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import database
import models
import schemas


# Lifespan context manager runs database initialization on server startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Step 1: Create SQLite tables and seed initial sample data
    database.init_db()
    yield
    # Cleanup on server shutdown if needed


# Initialize the FastAPI application with OpenAPI metadata
app = FastAPI(
    title="Personal Notes API",
    description="A clean, simple REST API for managing personal notes with search, pinning, and color tags.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ------------------------------------------------------------------------------
# CORS Middleware Configuration
# ------------------------------------------------------------------------------
# Allow the Vite React frontend (running at http://localhost:5173) to communicate with this API
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------------------
# Custom Exception Handler for Input Validation
# ------------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Catches Pydantic validation errors and returns a 400 Bad Request status code
    with a clear explanation of what failed validation.
    """
    errors = []
    for err in exc.errors():
        location = " -> ".join(str(loc) for loc in err.get("loc", []))
        message = err.get("msg", "Validation error")
        errors.append(f"{location}: {message}")

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Bad Request",
            "message": "Input validation failed. Please check the submitted fields.",
            "details": errors
        }
    )


# ------------------------------------------------------------------------------
# Root & Health Check Endpoints
# ------------------------------------------------------------------------------
@app.get("/", tags=["General"])
def root():
    """
    Welcome endpoint providing API status and link to interactive documentation.
    """
    return {
        "app": "Personal Notes API",
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "get_notes": "GET /api/notes?search=",
            "create_note": "POST /api/notes",
            "update_note": "PUT /api/notes/{id}",
            "delete_note": "DELETE /api/notes/{id}"
        }
    }


# ------------------------------------------------------------------------------
# REST API Endpoints for Notes
# ------------------------------------------------------------------------------

@app.get(
    "/api/notes",
    response_model=List[schemas.NoteResponse],
    status_code=status.HTTP_200_OK,
    tags=["Notes"]
)
def get_notes(
    search: Optional[str] = Query(None, description="Optional search string to filter notes by title or content"),
    db: Session = Depends(database.get_db)
):
    """
    GET /api/notes?search=
    Retrieves all notes, optionally filtered by title or content.
    Notes are sorted with pinned notes first, followed by the most recently updated.
    """
    query = db.query(models.Note)

    # Apply search filter if a non-empty search term is provided
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Note.title.ilike(term),
                models.Note.content.ilike(term)
            )
        )

    # Order: Pinned notes at top (True first), then by most recent updated_at timestamp
    notes = query.order_by(
        models.Note.is_pinned.desc(),
        models.Note.updated_at.desc()
    ).all()

    return notes


@app.post(
    "/api/notes",
    response_model=schemas.NoteResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Notes"]
)
def create_note(
    note_in: schemas.NoteCreate,
    db: Session = Depends(database.get_db)
):
    """
    POST /api/notes
    Creates a new note with a title, optional content, color, and pinned status.
    Returns 201 Created on success, or 400 Bad Request if validation fails.
    """
    # Create the ORM model instance from validated schema data
    new_note = models.Note(
        title=note_in.title,
        content=note_in.content or "",
        is_pinned=bool(note_in.is_pinned),
        color=note_in.color or "default",
        updated_at=datetime.now(timezone.utc)
    )

    # Add and commit to database
    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return new_note


@app.put(
    "/api/notes/{id}",
    response_model=schemas.NoteResponse,
    status_code=status.HTTP_200_OK,
    tags=["Notes"]
)
def update_note(
    id: int,
    note_in: schemas.NoteUpdate,
    db: Session = Depends(database.get_db)
):
    """
    PUT /api/notes/{id}
    Updates an existing note by ID.
    Returns 200 OK with the updated note, or 404 Not Found if the note does not exist.
    """
    # Look up the note in the database
    note = db.query(models.Note).filter(models.Note.id == id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with ID {id} was not found"
        )

    # Update only fields that were explicitly sent in the request
    if note_in.title is not None:
        note.title = note_in.title
    if note_in.content is not None:
        note.content = note_in.content
    if note_in.is_pinned is not None:
        note.is_pinned = note_in.is_pinned
    if note_in.color is not None:
        note.color = note_in.color

    # Refresh timestamp to track when the note was last edited
    note.updated_at = datetime.now(timezone.utc)

    # Commit changes and refresh instance
    db.commit()
    db.refresh(note)

    return note


@app.delete(
    "/api/notes/{id}",
    status_code=status.HTTP_200_OK,
    tags=["Notes"]
)
def delete_note(
    id: int,
    db: Session = Depends(database.get_db)
):
    """
    DELETE /api/notes/{id}
    Deletes an existing note by ID.
    Returns 200 OK with confirmation message, or 404 Not Found if the note does not exist.
    """
    # Look up the note in the database
    note = db.query(models.Note).filter(models.Note.id == id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with ID {id} was not found"
        )

    # Delete the note and commit
    db.delete(note)
    db.commit()

    return {
        "message": "Note deleted successfully",
        "id": id
    }
