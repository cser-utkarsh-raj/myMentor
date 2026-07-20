# ⭐ myMentor

> **AI-Powered Learning Platform & Career Roadmap Tracker**  
> *Duolingo meets Notion, meets GitHub Contributions.*

`myMentor` is a production-quality, microservice-ready web application designed to help developers and learners construct personalized learning roadmaps, track their daily progress, log study hours, and gamify their curriculum with XP and achievements. 

Designed with software engineering maturity, the backend adopts a **Modular Monolith** architecture with a clean **Controller → Service → Repository** pattern, paving a clear extraction path to a distributed microservice network in V2.

---

## 🚀 Key Features

- 🗺️ **Rule-Based Roadmap Generator**: Decoupled, configuration-driven generator that parses JSON blueprints into active Track $\rightarrow$ Milestone $\rightarrow$ Day $\rightarrow$ Task schemas, dynamically adjusted to user timelines.
- ⚡ **Gamified XP & Streak Engine**: Gain +10 XP for checking off topics, +100 XP for completing days, maintain streaks, and unlock progression-based badges.
- 📅 **Focused Workspace (Today Page)**: Dual-pane dashboard containing daily agendas, a built-in study Pomodoro timer, and a Notion-style autosaving Markdown notes editor.
- 📊 **Rich Developer Analytics**: GitHub-style contributions heatmap tracking daily activity, weekly study hour AreaCharts, weakest topic indicators, and most-revised topic metrics.
- 📄 **Local Document Management**: A secure PDF registry allowing users to manage local learning reference papers and portfolios.
- 🎨 **Frosted Glass Aesthetics**: Sleek dark mode glassmorphism UI with smooth Framer Motion transitions and customizable color accents (Purple, Cyan, Emerald).

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite | Modern component rendering, strict type-safety |
| **Styling & Motion** | TailwindCSS v4, Framer Motion | Frosted glass utilities, keyframe animations |
| **State & Query** | Zustand, TanStack React Query | Separated client UI states and caching query layers |
| **Backend** | FastAPI, Python 3.13 | High-performance asynchronous API, auto Swagger UI |
| **Database ORM** | SQLAlchemy, Pydantic | Secure model schemas with clean relation cascades |
| **Database** | PostgreSQL (Primary), SQLite | Auto-configured for local SQLite fallback execution |
| **DevOps** | Docker, Docker Compose | Multi-stage builds, containerized DB links |

---

## 📂 Codebase Folder Structure

```
myMentor/
├── frontend/
│   ├── src/
│   │   ├── components/       # Glassmorphic UI components (Sidebar)
│   │   ├── hooks/            # TanStack Query REST client integrations (useApi)
│   │   ├── pages/            # View pages (Dashboard, Today, Roadmap, Progress, etc.)
│   │   ├── store/            # Zustand global client UI states
│   │   ├── utils/            # Time and formatting helpers
│   │   └── main.tsx          # React bootloader
│   └── vite.config.ts        # Tailwind v4 Vite compiler plugin config
├── backend/
│   ├── app/
│   │   ├── api/              # API router setups
│   │   ├── core/             # Loguru logging, security, environment configurations
│   │   ├── database/         # SessionLocal context, engine setup
│   │   ├── models/           # Relational schemas (Goal, Track, Task, Stats, Badge)
│   │   ├── schemas/          # Pydantic serialization & request validators
│   │   ├── services/         # Domain business layer (GoalService, RoadmapService)
│   │   ├── routers/          # HTTP Controllers (endpoints routes)
│   │   ├── resources/        # Pre-baked JSON roadmap profiles (Must75, Blind75)
│   │   ├── uploads/          # Local PDF repository storage
│   │   ├── ai/               # [V2 Expansion Placeholder]
│   │   ├── notifications/    # [V2 Expansion Placeholder]
│   │   ├── integrations/     # [V2 Expansion Placeholder]
│   │   ├── scheduler/        # [V2 Expansion Placeholder]
│   │   └── main.py           # FastAPI entrypoint
│   ├── requirements.txt      # Python dependencies manifest
│   ├── Dockerfile            # Container deployment blueprint
│   └── docker-compose.yml    # Full local network deployment (FastAPI + PostgreSQL)
└── README.md
```

---

## 📐 Architecture Design

```
                     ┌──────────────────────────┐
                     │      React 19 App        │
                     │  (Zustand + React Query) │
                     └─────────────┬────────────┘
                                   │  HTTP / REST
                                   ▼
                     ┌──────────────────────────┐
                     │    FastAPI Controllers   │
                     │       (app/routers)      │
                     └─────────────┬────────────┘
                                   │
                                   ▼
                     ┌──────────────────────────┐
                     │     Service Layer        │
                     │      (app/services)      │
                     └─────────────┬────────────┘
                                   │
                                   ▼
                     ┌──────────────────────────┐
                     │       SQLAlchemy         │
                     │     Database Engine      │
                     └─────────────┬────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │   PostgreSQL (Neon)  │      │   SQLite Fallback    │
        │      (Production)    │      │    (Local Dev DB)    │
        └──────────────────────┘      └──────────────────────┘
```

---

## ⚙️ Installation & Running Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- *Or* Docker Desktop

### Method A: Single Command Run (Docker Compose)
Runs the entire stack with PostgreSQL and FastAPI running inside isolated containers:
```bash
# Clone the repository and enter the folder
cd myMentor/backend

# Launch the containers
docker-compose up --build
```
The backend server starts on [http://localhost:8000](http://localhost:8000) and the database automatically connects.

---

### Method B: Manual Local Setup (SQLite fallback)

#### 1. Start Backend Server
```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env config
cp .env.example .env

# Run FastAPI app
python app/main.py
```
*Note: In the absence of a running PostgreSQL server, the app falls back to SQLite `sqlite:///./mymentor.db` automatically.*

#### 2. Start Frontend Server
```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📡 API Endpoints

FastAPI generates automated OpenAPI Swagger documentation at [http://localhost:8000/docs](http://localhost:8000/docs). Key endpoints:

- **Goals Setup**:
  - `POST /api/v1/goals/` : Submit onboarding wizard details and generate the scaling roadmap.
  - `GET /api/v1/goals/active` : Check for active goal configurations.
  - `GET /api/v1/goals/{id}/analytics` : Compile contribution heatmaps and study metrics.
- **Tasks & Checklist**:
  - `PUT /api/v1/tasks/{id}` : Check off topics, edit notes, increment revision counts.
- **Study Timers**:
  - `POST /api/v1/timer/sessions` : Log study blocks and compile daily statistics.
- **PDF Uploads**:
  - `POST /api/v1/pdfs/` : Upload learning resources.
  - `GET /api/v1/pdfs/` : List catalog details.

---

## 🔮 Future Expansion (V2 Roadmap)

- 🔒 **Secure Authorization**: OAuth2 with JWT refresh tokens for cloud accounts.
- 🤖 **Gemini AI Mentor**: Chatbot assistant parsed directly from your uploaded PDF catalog using embeddings.
- 🔄 **Neon Cloud Sync**: Sync local SQLite databases directly to PostgreSQL in the cloud upon login.
