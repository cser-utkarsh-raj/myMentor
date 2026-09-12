<div align="center">

<img src="https://raw.githubusercontent.com/cser-utkarsh-raj/myMentor/main/frontend/public/favicon.svg" alt="myMentor logo" width="96" height="96" />

# myMentor

### Turn a goal into a learning system.

**AI-guided roadmaps · daily execution · measurable progress · personal mentorship**

[Live App](https://my-mentor-wheat.vercel.app/) · [Repository](https://github.com/cser-utkarsh-raj/myMentor)

</div>

---

## Overview

**myMentor** is a personal learning workspace designed to take a learner from an outcome they want to achieve to a structured, trackable execution plan.

Instead of treating AI as a one-shot answer generator, myMentor combines an AI-generated curriculum with the systems needed to actually follow it: goals, tracks, modules, daily study steps, resources, notes, focus sessions, progress signals, achievements, documents, and an in-context AI mentor.

The product is built around a simple loop:

```text
Define a goal
     ↓
Build a structured roadmap
     ↓
Execute today's work
     ↓
Track completion + study time
     ↓
Learn from progress
     ↓
Ask Sensei when you get stuck
     ↓
Keep moving toward the goal
```

myMentor is a flagship product in the **.dot** ecosystem.

## What it does

### 1. Goal → structured roadmap

A learner defines a goal, target, available daily study time, and timeline. myMentor turns that input into an ordered curriculum with:

- Tracks
- Modules
- Daily learning steps
- Study resources
- Difficulty progression
- Estimated study time
- XP-bearing activities
- A final practical/capstone-oriented progression

AI-generated roadmaps are validated before being persisted. When AI generation is unavailable or returns an unusable result, the application can fall back to curated local roadmap templates rather than presenting a fake successful generation.

### 2. Daily execution workspace

The roadmap is intended to be executed, not merely read. Learners can work through scheduled resources, mark work complete, record notes, and accumulate progress against their goal.

The data model tracks completion, notes, revision count, completion timestamps, study sessions, daily statistics, XP, and streak information.

### 3. Sensei — the AI mentor

Sensei is the conversational learning layer inside myMentor.

It can:

- Explain topics at a selected difficulty
- Answer learning questions in context
- Provide daily study tips
- Use the learner's active goal as context
- Use stored learning memories such as strengths, weaknesses, preferences, and progress summaries
- Use extracted material from registered PDFs as learning context
- Generate structured roadmaps
- Summarize PDF material into summaries, key concepts, and flashcards

Sensei also supports selectable mentoring personalities, while keeping the underlying learning behavior focused on practical and technically useful guidance.

### 4. Adaptive roadmap generation

Roadmap generation combines AI with a deterministic persistence/scaling layer. The application can take a generated or curated curriculum and distribute its learning steps across the learner's requested timeline.

This means a roadmap can be shaped around different time budgets instead of being locked to one fixed number of days.

### 5. Progress and motivation

myMentor treats progress as a first-class product surface rather than an afterthought.

The application tracks:

- XP
- Current streak
- Longest streak
- Completed learning resources
- Study sessions
- Daily study hours
- Daily task completion
- Consistency signals
- Revision counts
- Badges and achievements
- Contribution-style activity/progress views

A **Recovery Mode** is also available for learners who fall behind: it extends the timeline and reduces the daily workload to make the plan more sustainable.

### 6. Learning resources

Resources are represented as actionable study objects rather than simple links. They can contain:

- Title and description
- Category
- Platform
- Difficulty
- Estimated duration
- External URL
- Notes
- Tags
- Completion state
- Revision history

The backend also ships with curated local roadmap/resource data for several common learning and career paths, while custom goals have a generic fallback curriculum.

### 7. PDF-powered learning

Learners can register PDF study material, extract its text, organize documents, and use that material as context for AI-powered learning workflows.

PDF functionality includes:

- Document registration
- Text extraction
- Extraction status tracking
- Categorization and tags
- Archiving
- AI summarization
- Key-concept extraction
- Flashcard generation
- PDF-aware roadmap generation
- PDF context for Sensei conversations

### 8. Authentication and user-scoped data

Goals and learning data are associated with the authenticated account. Protected API routes verify ownership before allowing goal, task, analytics, badge, and learning-data operations.

The backend also exposes health endpoints for deployment/environment validation.

---

## Product surfaces

| Surface | Role |
|---|---|
| **Landing** | Introduces the product and its learning workflow |
| **Login / Signup** | Account entry and onboarding |
| **Goal Setup** | Defines the learner's target, schedule, timeline, and mentor configuration |
| **Dashboard** | High-level view of the active goal, progress, streak, XP, and focus workflow |
| **Roadmap** | Structured curriculum and day-by-day execution |
| **Today** | Daily work, focus sessions, and Markdown notes |
| **Progress** | Learning analytics, activity, revisions, and achievements |
| **Resources** | Learning-resource discovery and management |
| **Documents** | PDF registration and document-powered learning workflows |
| **Sensei** | AI mentoring and contextual learning assistance |
| **Settings** | Profile, appearance, session, export/reset, and goal controls |

---

## Architecture

```text
┌───────────────────────────────────────────────┐
│                  React 19                     │
│             TypeScript + Vite                 │
│                                               │
│  Pages · Components · Zustand · React Query   │
│  Tailwind CSS · Framer Motion · Recharts      │
└──────────────────────┬────────────────────────┘
                       │ REST / JSON
                       ▼
┌───────────────────────────────────────────────┐
│                   FastAPI                     │
│                                               │
│  Routers → Services → Repositories / ORM      │
│                                               │
│  Goals · Tasks · Timer · Resources · PDFs     │
│  Analytics · System · AI                      │
└───────────────┬─────────────────┬─────────────┘
                │                 │
                ▼                 ▼
        ┌──────────────┐   ┌──────────────────┐
        │ SQLAlchemy   │   │    AI Service    │
        │              │   │                  │
        │ PostgreSQL   │   │ Gemini           │
        │ / SQLite     │   │ DeepSeek fallback│
        └──────────────┘   └──────────────────┘
                                  │
                                  ▼
                         PDF / learning context
```

The backend follows a modular-monolith architecture. Domain behavior is separated into routers, services, models, schemas, database configuration, and supporting resources, keeping the system straightforward to deploy while leaving room for future extraction if scale requires it.

---

## AI architecture

The AI layer is designed around graceful degradation rather than assuming that a model call will always succeed.

### Gemini

Gemini is the primary provider. The service supports multiple configured Gemini API keys and a sequence of model fallbacks. This allows the application to rotate credentials/models when a provider call fails or a quota becomes temporarily unavailable.

### DeepSeek

DeepSeek is supported as a provider fallback through its chat-completions API when configured.

### Local fallback

AI is not treated as the only source of truth for roadmap availability. Curated JSON roadmaps are bundled with the backend, and roadmap persistence can fall back to these templates when dynamic generation is unavailable.

---

## Data model

At the center of the application is the relationship between a learner, their goal, and the work required to reach it.

```text
User
 │
 └── Goal
      ├── Tracks
      │    └── Modules
      │         └── Days
      │              └── Resources / Tasks
      │
      ├── Study Sessions
      ├── Daily Statistics
      ├── Badges
      └── AI Memories

User
 └── PDFs
       └── Extracted learning context
```

This structure lets the application connect **planning → execution → evidence of progress → personalized assistance** rather than storing a roadmap as static AI text.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Routing | React Router |
| Styling | Tailwind CSS 4 |
| Motion | Framer Motion |
| Client state | Zustand |
| Server state | TanStack React Query |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | FastAPI, Uvicorn, Python |
| ORM | SQLAlchemy |
| Validation | Pydantic / Pydantic Settings |
| Database | PostgreSQL / SQLite |
| Migrations | Alembic |
| Authentication | JWT-based backend authentication |
| AI | Google Gemini, optional DeepSeek fallback |
| Documents | pypdf |
| Logging | Loguru |
| Deployment | Vercel + container-ready FastAPI backend |
| Containers | Docker / Docker Compose |

---

## Repository structure

```text
myMentor/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       │   ├── Landing.tsx
│       │   ├── Login.tsx
│       │   ├── Signup.tsx
│       │   ├── GoalSetup.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Roadmap.tsx
│       │   ├── Today.tsx
│       │   ├── Progress.tsx
│       │   ├── Resources.tsx
│       │   ├── PDFs.tsx
│       │   ├── Sensei.tsx
│       │   └── Settings.tsx
│       └── store/
│
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── resources/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── services/
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml
├── vercel.json
└── README.md
```

---

## API surface

The FastAPI backend is organized into dedicated route groups for the application's major domains.

| Route group | Responsibility |
|---|---|
| `/api/v1/goals` | Goal creation, retrieval, deletion, analytics, badges, recovery mode |
| `/api/v1/tasks` | Resource/task completion, notes, and revision-related updates |
| `/api/v1/timer` | Study/focus session tracking |
| `/api/v1/pdfs` | PDF registration, processing, and document workflows |
| `/api/v1/resources` | Learning-resource operations |
| `/api/v1/system` | System/application endpoints |
| `/api/v1/ai` | Sensei chat, explanations, roadmaps, tips, and PDF summaries |
| `/health` | Deployment/database health check |
| `/api/v1/health` | Versioned health check |

Interactive API documentation is available from FastAPI at `/docs` when the backend is running.

---

## Run locally

### Prerequisites

- Node.js
- Python 3.x
- PostgreSQL for a production-like local database, or SQLite for lightweight development
- Gemini API credentials for AI features
- Optional DeepSeek API credentials for provider fallback

### 1. Backend

```bash
cd backend
python -m venv venv
```

Activate the environment:

```bash
# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

Install dependencies and configure environment variables:

```bash
pip install -r requirements.txt
cp .env.example .env
```

Start the API:

```bash
python app/main.py
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs on the default Vite development port. The backend runs on the configured API port, normally `8000`.

### 3. Docker

From the repository root:

```bash
docker compose up --build
```

---

## Environment configuration

Backend configuration is provided through `backend/.env.example`.

Typical configuration includes:

```env
PROJECT_NAME=myMentor
DATABASE_URL=...
GEMINI_API_KEY=...
GEMINI_API_KEY_2=...
GEMINI_API_KEY_3=...
DEEPSEEK_API_KEY=...
```

Never commit real provider credentials or production secrets to the repository.

---

## Deployment

The frontend is configured as a Vite application and is connected to the **my-mentor** Vercel project. The current production deployment is served through the project's Vercel domains.

The backend is independently deployable as a FastAPI service and is container-ready through the included Docker configuration.

For production deployments, configure the frontend API base URL and backend environment variables for the target environment rather than relying on local development defaults.

---

## Performance

The deployed frontend has been tested with a synthetic performance audit. The recorded test showed:

- **First Contentful Paint:** 1.7 s
- **Largest Contentful Paint:** 1.8 s
- **Cumulative Layout Shift:** 0
- **Total Blocking Time:** 1 ms
- **26 / 30** performance recommendations satisfied

The remaining optimization work is primarily around rendering behavior and content visibility rather than a fundamentally slow frontend delivery path.

---

## Design philosophy

myMentor is deliberately more than an AI chatbot and more than a static course planner.

Its product model is:

> **Plan the work. Do the work. Measure the work. Get help when needed. Keep progressing.**

The interface combines a bold neo-brutalist visual language with glassmorphism, motion, progress visualization, and a learning-focused information hierarchy.

The goal is to make a learner's next useful action obvious while preserving enough historical context to show whether they are actually moving forward.

---

## Engineering principles

- **Execution over generation** — AI output should lead to actionable learning work.
- **Graceful degradation** — provider failures should not masquerade as successful AI generation.
- **User-scoped data** — protected resources are checked against the authenticated user.
- **Deterministic persistence** — generated curriculum is converted into structured database records.
- **Editable learning state** — progress, notes, revisions, and completion remain user-controlled.
- **Secrets stay server-side** — provider credentials belong in environment configuration.
- **Modular boundaries** — domain logic is separated into services and routers instead of being concentrated in UI code.

---

## Status

myMentor is an actively deployed product with a working frontend, FastAPI backend, persistent learning data model, AI workflows, document processing, and production deployment configuration.

The codebase remains intentionally open to continued hardening, performance tuning, and feature evolution as the product moves from a strong personal learning system toward a broader learning operating system.

---

<div align="center">

**myMentor**

*Learn with direction. Build with proof.*

**Presented by .dot**

</div>
