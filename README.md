# 📝 Personal Notes App

A fast, elegant, and beginner-friendly full-stack Personal Notes application built with a modern three-layer architecture:
- **Frontend**: React 18 created with Vite (functional components, React hooks, pure Vanilla CSS, no external UI libraries)
- **Backend**: FastAPI (Python) REST API with Pydantic v2 request/response validation
- **Persistence**: SQLite database accessed through the SQLAlchemy 2.0 ORM

---

## 🌟 Features

1. **Two-Column Split Layout**:
   - **Left Sidebar**: Interactive list of notes with live title, content preview snippets, relative timestamps, color tag pills, and pin status.
   - **Right Panel**: Full-featured note editor displaying the currently selected note or drafting a new one.
2. **Create New Notes**:
   - Quick `+ New Note` button in the sidebar or empty state hero button.
   - Auto-focuses the title field for instant composing.
3. **Edit and Save Notes**:
   - Edit title and content seamlessly.
   - Visual dirty indicator (`● Unsaved changes`) and last saved timestamp.
   - Convenient keyboard shortcut: <kbd>Ctrl+S</kbd> / <kbd>Cmd+S</kbd> to save.
4. **Delete with Confirmation Dialog**:
   - Prevents accidental loss with an accessible confirm modal dialog.
   - Provides clear warning and deletion options.
5. **Real-time Search Filter**:
   - Search box in the sidebar filters notes by **title** or **content** simultaneously (`GET /api/notes?search=...`).
   - Includes one-click clear button (`✕`) and helpful empty states.
6. **Stretch Goals Implemented**:
   - 📌 **Pinned Notes**: Toggle any note as pinned to keep it anchored at the top of the list.
   - 🎨 **Color Tagging**: Color-code notes with curated pastel palettes (*Default*, *Amber*, *Mint*, *Indigo*, *Blush*, *Lavender*, *Sky*).
7. **Database Auto-Seeding**:
   - Automatically populates the SQLite database with 4 rich sample notes on first run to explore features right away.
8. **Interactive API Documentation**:
   - FastAPI auto-generates interactive Swagger documentation at [`http://localhost:8000/docs`](http://localhost:8000/docs) and ReDoc at [`http://localhost:8000/redoc`](http://localhost:8000/redoc).

---

## 🏛️ Architecture & Three-Layer Separation

The codebase strictly isolates responsibilities across three distinct layers, with an explicit layer comment header at the top of every file:

```
notes_app/
├── backend/
│   ├── main.py             # Layer: Backend API (FastAPI routes, CORS, validation handler)
│   ├── database.py         # Layer: Database Persistence (SQLAlchemy 2.0 engine, sessions, seed data)
│   ├── models.py           # Layer: Database Model (SQLAlchemy 2.0 ORM Note entity)
│   ├── schemas.py          # Layer: Backend Validation & Schemas (Pydantic v2 models)
│   ├── requirements.txt    # Layer: Backend Dependencies (Version-pinned)
│   └── notes.db            # Auto-generated SQLite database
├── frontend/
│   ├── index.html          # HTML entry point with Google Fonts (Inter & Plus Jakarta Sans)
│   ├── package.json        # Frontend Dependencies (Version-pinned)
│   ├── vite.config.js      # Vite build configuration
│   └── src/
│       ├── main.jsx        # Layer: Frontend Application Bootstrap
│       ├── App.jsx         # Layer: Frontend Application Root (state & modal orchestration)
│       ├── api.js          # Layer: Frontend API Client (HTTP fetch service)
│       ├── index.css       # Layer: Frontend Styling (Vanilla CSS design system)
│       └── components/
│           ├── NoteList.jsx    # Layer: Frontend Component (Sidebar, search, card list)
│           └── NoteEditor.jsx  # Layer: Frontend Component (Editor, color picker, pin toggle)
└── README.md
```

---

## 📋 Prerequisites

Before running the application, make sure you have installed:
- **Python 3.10+** (Python 3.12 tested)
- **Node.js 16+** (Node v16.17+ / v18+ / v20+ tested)
- **npm** (comes with Node.js)

---

## 🚀 Installation & Setup

### 1. Backend Setup

Open a terminal and navigate to the `backend/` directory:

```bash
cd notes_app/backend
```

*(Optional but recommended)* Create and activate a Python virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

Install the pinned backend dependencies:
```bash
pip install -r requirements.txt
```

### 2. Frontend Setup

Open a second terminal window and navigate to the `frontend/` directory:

```bash
cd notes_app/frontend
```

Install the pinned frontend dependencies:
```bash
npm install
```

---

## ▶️ Running the Application

### Step 1: Start the Backend Server

From the `notes_app/backend` directory:

```bash
uvicorn main:app --reload --port 8000
```

- Backend server URL: **`http://localhost:8000`**
- Interactive Swagger API Documentation: **`http://localhost:8000/docs`**
- Alternative ReDoc Documentation: **`http://localhost:8000/redoc`**

> ℹ️ **FastAPI Auto-Generated Docs**: FastAPI automatically inspects Pydantic schemas and route signatures to produce interactive Swagger docs at `/docs`. You can test every endpoint directly from your browser!

### Step 2: Start the Frontend App

From the `notes_app/frontend` directory:

```bash
npm run dev
```

- Open your browser at: **`http://localhost:5173`**

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/notes?search=` | Retrieve all notes (optional filter by title or content). Pinned notes first. | `200 OK` |
| `POST` | `/api/notes` | Create a new note. Requires non-blank `title`. | `201 Created`, `400 Bad Request` |
| `PUT` | `/api/notes/{id}` | Update existing note fields (`title`, `content`, `is_pinned`, `color`). | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/notes/{id}` | Delete a note by its ID. | `200 OK`, `404 Not Found` |

### Sample `POST /api/notes` Request Body
```json
{
  "title": "Meeting Summary",
  "content": "Discussed roadmap and Q4 release schedule.",
  "is_pinned": true,
  "color": "indigo"
}
```

---

## 🗄️ Database Model

The database entity is defined in [`notes_app/backend/models.py`](file:///notes_app/backend/models.py) using SQLAlchemy 2.0:

```python
class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    color: Mapped[str] = mapped_column(String(50), default="default")
```

---

## 🧪 Testing the Setup

To verify both layers locally:
1. Run backend tests:
   ```bash
   cd notes_app/backend
   python -c "import database; database.init_db(); print('Database OK!')"
   ```
2. Build frontend production assets:
   ```bash
   cd notes_app/frontend
   npm run build
   ```
