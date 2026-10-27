# ==============================================================================
# LAYER: Database Model Layer (SQLAlchemy 2.0 ORM)
# Description: Defines the Note entity and its database column mappings.
#              Uses modern SQLAlchemy 2.0 type-annotated Mapped and mapped_column.
# ==============================================================================

from datetime import datetime, timezone
from sqlalchemy import Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Note(Base):
    """
    SQLAlchemy 2.0 ORM model representing a personal note stored in SQLite.

    Columns:
      - id: Unique integer primary key (auto-incrementing)
      - title: The headline/title of the note (required, max 200 chars)
      - content: The body text of the note (default empty string)
      - updated_at: Timestamp of when the note was created or last edited
      - is_pinned: Stretch goal flag to keep important notes at top of the list
      - color: Stretch goal color tag name for visually organizing notes
    """
    __tablename__ = "notes"

    # Auto-incrementing primary key identifier
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)

    # Note title (cannot be null)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)

    # Note body content (text format, defaults to empty)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # Timestamp indicating when note was last modified
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Stretch goal: Pinned flag to keep note at the top of the list
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Stretch goal: Color tag for the note card (e.g., 'default', 'amber', 'emerald', 'indigo', 'rose', 'purple')
    color: Mapped[str] = mapped_column(String(50), default="default", nullable=False)

    def __repr__(self) -> str:
        return f"<Note(id={self.id}, title='{self.title[:20]}', is_pinned={self.is_pinned})>"
