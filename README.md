# 🧠 myMentor

> **AI-powered learning platform & career roadmap tracker.**
>
> *Duolingo meets Notion meets GitHub Contributions — built for serious learning.*

`myMentor` turns a learning or career goal into a structured, trackable journey. It combines AI-generated roadmaps, daily study planning, resources, notes, analytics, gamification, document context, and an AI mentor in one workspace.

It is one of the flagship products in the **.dot** ecosystem.

## ✨ Core Capabilities

- 🗺️ **Progressive AI Roadmaps** — turns a goal into ordered tracks, milestones, days, tasks, resources, and capstones.
- 🤖 **Sensei AI Mentor** — conversational mentoring with selectable personas and learning-material context.
- 🔄 **Multi-LLM failover** — Gemini and DeepSeek-backed generation with provider fallback.
- 🏆 **Progress gamification** — XP, streaks, badges, milestone completion, and contribution-style activity.
- 📅 **Today workspace** — daily agenda, Pomodoro focus timer, and autosaving Markdown notes.
- 📊 **Learning analytics** — study-hour charts, contribution heatmap, weak-topic and revision signals.
- 📚 **Resource library** — organize theory, videos, exercises, projects, and custom resources.
- 📄 **PDF workflow** — register learning documents, extract their text, and use them for roadmap generation and Sensei context.
- 🔐 **Account security** — explicit authenticated sessions and user-scoped data.
- 🎨 **Distinctive UI** — neo-brutalist + glassmorphism design with multiple visual palettes and motion.

## 🖥️ Main Views

| View | Purpose |
|---|---|
| **Dashboard** | Goal summary, XP, streak, milestone, and focus tools |
| **Setup Wizard** | Define target, schedule, theme, and Sensei persona |
| **Roadmap** | Navigate the curriculum and complete tasks |
| **Today** | Execute today's plan, focus, and take notes |
| **Progress** | Analytics, activity, revisions, and achievements |
| **Resources** | Search and manage learning resources |
| **Documents** | Organize PDFs and create context-aware learning flows |
| **Sensei** | Chat with the AI mentor |
| **Settings** | Profile, theme, session, export, and reset controls |

## 🏗️ Architecture

```text
React 19 + TypeScript + Vite
          │
          │ REST
          ▼
      FastAPI API
          │
     ┌────┴───────────────┐
     ▼                    ▼
 Domain Services      AI Services
     │                ┌────┴─────┐
     ▼                ▼          ▼
SQLAlchemy          Gemini    DeepSeek
     │
 ┌───┴──────────┐
 ▼              ▼
PostgreSQL    SQLite
```

The backend follows a **Controller → Service → Repository** structure. The modular-monolith approach keeps the application cohesive today while leaving a clean path toward future service extraction.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| UI | Tailwind CSS 4, Framer Motion |
| State / Data | Zustand, TanStack React Query |
| Backend | FastAPI, Python |
| Persistence | PostgreSQL / SQLite |
| ORM / Schemas | SQLAlchemy, Pydantic |
| AI | Google Gemini, DeepSeek |
| DevOps | Docker, Docker Compose |

## 🚀 Run Locally

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app/main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173` · API: `http://localhost:8000`

Docker:

```bash
cd backend
docker-compose up --build
```

## 🔒 Engineering Principles

- User data stays scoped to the authenticated account.
- AI fallback should fail honestly rather than fabricate successful generation.
- Provider credentials belong in environment configuration, never source control.
- Roadmaps remain editable and measurable by the learner.
- The application is designed around learning outcomes rather than simply generating AI text.

## 📂 Repository Layout

```text
myMentor/
├── frontend/src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── store/
│   └── utils/
├── backend/app/
│   ├── api/
│   ├── core/
│   ├── database/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── routers/
└── README.md
```

## 🧭 Product Direction

myMentor is evolving toward a **personal learning operating system** connecting goals, curriculum, study sessions, resources, documents, AI mentorship, and measurable progress — without forcing learners to stitch together several disconnected tools.

> **myMentor · Learn with direction. Build with proof.**
>
> **Presented by .dot**
