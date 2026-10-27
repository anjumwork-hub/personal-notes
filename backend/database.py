# ==============================================================================
# LAYER: Database Persistence Layer (SQLAlchemy 2.0 ORM & SQLite)
# Description: Handles database engine configuration, session lifecycle management,
#              table creation, and seeding sample data on initial startup.
# ==============================================================================

import os
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Define the absolute path to the SQLite database file in the backend folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "notes.db")

# SQLite connection URL (check_same_thread=False allows FastAPI multithreaded requests)
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create the SQLAlchemy engine for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Session factory for creating independent database sessions per request
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for all ORM models to inherit from
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a transactional database session per request.
    Ensures that the database session is always closed after the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_sample_data(db: Session):
    """
    Seeds the database with high-quality sample notes if the table is empty.
    Demonstrates features like pinned notes, color tags, and searchability.
    """
    # Import Note model here to avoid circular dependencies
    from models import Note

    # Check if any notes already exist in the database
    existing_count = db.query(Note).count()
    if existing_count > 0:
        return

    # Sample notes demonstrating different use cases and stretch goal features
    sample_notes = [
        Note(
            title="📌 Welcome to Personal Notes!",
            content=(
                "Welcome to your personal notes organizer! 🚀\n\n"
                "Here are key features you can try:\n"
                "- 🔍 Search notes instantly by title or content\n"
                "- 📌 Pin important notes to keep them at the top\n"
                "- 🎨 Color-code your notes with pastel tags\n"
                "- ✏️ Edit or delete notes with single clicks\n"
                "- 📱 Responsive split-view layout"
            ),
            is_pinned=True,
            color="amber",
            updated_at=datetime.now(timezone.utc)
        ),
        Note(
            title="🏗️ Project Architecture & Tech Stack",
            content=(
                "Three-tier architecture:\n"
                "1. Frontend: React 18 + Vite (Vanilla CSS, custom hooks, responsive design)\n"
                "2. Backend API: FastAPI + Pydantic v2 (RESTful endpoints, input validation)\n"
                "3. Persistence: SQLite + SQLAlchemy 2.0 ORM (clean declarative models)\n\n"
                "Check out the interactive Swagger API documentation at: http://localhost:8000/docs"
            ),
            is_pinned=True,
            color="indigo",
            updated_at=datetime.now(timezone.utc)
        ),
        Note(
            title="🛒 Weekend Grocery & Shopping List",
            content=(
                "Items to pick up from the market:\n"
                "- Organic almond milk 🥛\n"
                "- Sourdough loaf 🍞\n"
                "- Fresh avocados & baby spinach 🥑🥗\n"
                "- Dark roast coffee beans ☕\n"
                "- Himalayan sea salt"
            ),
            is_pinned=False,
            color="emerald",
            updated_at=datetime.now(timezone.utc)
        ),
        Note(
            title="💡 Great Ideas & Future Enhancements",
            content=(
                "- Markdown preview mode for note content\n"
                "- Export notes as PDF or JSON backups\n"
                "- Dark mode and custom themes toggle\n"
                "- Word and character counter in the editor"
            ),
            is_pinned=False,
            color="rose",
            updated_at=datetime.now(timezone.utc)
        ),
    ]

    # Add all sample notes to the session and commit
    db.add_all(sample_notes)
    db.commit()


def init_db():
    """
    Initializes database tables and seeds default records if empty.
    Called when the FastAPI application starts up.
    """
    # Create all tables defined in Base metadata
    Base.metadata.create_all(bind=engine)

    # Populate sample data inside a dedicated session
    db = SessionLocal()
    try:
        seed_sample_data(db)
    finally:
        db.close()
