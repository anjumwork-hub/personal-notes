# ==============================================================================
# LAYER: Backend Validation & Schema Layer (Pydantic v2 Models)
# Description: Defines Pydantic data schemas used for incoming request validation,
#              data sanitization, and structured JSON API response serialization.
# ==============================================================================

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class NoteBase(BaseModel):
    """
    Shared attributes for note creation and responses.
    """
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Title of the note (cannot be empty or whitespace only)"
    )
    content: Optional[str] = Field(
        default="",
        description="Detailed body text or markdown of the note"
    )
    is_pinned: Optional[bool] = Field(
        default=False,
        description="Whether this note is pinned to the top of the note list"
    )
    color: Optional[str] = Field(
        default="default",
        description="Color tag identifier (e.g. 'default', 'amber', 'emerald', 'indigo', 'rose', 'purple')"
    )

    @field_validator("title")
    @classmethod
    def validate_title_not_blank(cls, value: str) -> str:
        """
        Validates that the title is not empty or composed solely of whitespace.
        """
        stripped = value.strip()
        if not stripped:
            raise ValueError("Note title cannot be blank or whitespace only")
        return stripped

    @field_validator("color")
    @classmethod
    def sanitize_color(cls, value: Optional[str]) -> str:
        """
        Ensures color string is safe and valid.
        """
        allowed_colors = {"default", "amber", "emerald", "indigo", "rose", "purple", "sky"}
        if value and value.lower() in allowed_colors:
            return value.lower()
        return "default"


class NoteCreate(NoteBase):
    """
    Schema for creating a new note via POST /api/notes.
    Inherits all fields and validators from NoteBase.
    """
    pass


class NoteUpdate(BaseModel):
    """
    Schema for updating an existing note via PUT /api/notes/{id}.
    All fields are optional to allow partial updates.
    """
    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="Updated title of the note"
    )
    content: Optional[str] = Field(
        None,
        description="Updated body text of the note"
    )
    is_pinned: Optional[bool] = Field(
        None,
        description="Updated pinned state"
    )
    color: Optional[str] = Field(
        None,
        description="Updated color tag"
    )

    @field_validator("title")
    @classmethod
    def validate_title_if_provided(cls, value: Optional[str]) -> Optional[str]:
        """
        Validates that if a title is provided, it is not blank.
        """
        if value is not None:
            stripped = value.strip()
            if not stripped:
                raise ValueError("Note title cannot be blank or whitespace only")
            return stripped
        return value


class NoteResponse(NoteBase):
    """
    Schema for returning note objects in API responses.
    Includes the database-generated id and updated_at timestamp.
    """
    id: int
    updated_at: datetime

    # Enable ORM mode so Pydantic can read attributes from SQLAlchemy Note model instances
    model_config = ConfigDict(from_attributes=True)
