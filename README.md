# EBP — Employee & Branch Portal

A UK retail workforce management platform with AI-powered leave predictions, RAG chatbot, and analytics dashboards.

---

## Features

### Leave Predictions
- **Store-level predictions** — forecast which employees are likely to take leave across all stores
- **Employee-level predictions** — individual leave signals based on historical patterns, bank holidays, and leave gaps
- **Confidence scoring** — each prediction includes a confidence percentage and signal breakdown
- **3D visual cards** — predictions displayed with visual signal chips (pattern, frequency, bridge leave indicators)

### AI Chatbot
- **Business mode** — ask about store predictions, employee schedules, upcoming holidays, and workforce data
- **General mode** — open-ended Q&A with professional conduct guardrails enforced
- **RAG (Retrieval-Augmented Generation)** — admin can train the chatbot on employee data via Milvus vector embeddings
- **Chat history** — persistent sessions with up to 10 conversations per user

### Reports & Analytics
- Monthly leave trend charts with gradient bars
- Leave type breakdown (3D donut chart)
- Store leaderboard ranked by leave activity
- KPI cards: total leaves, avg per employee, peak month, most common type

### Store & Employee Management
- Multi-store support (10 UK locations)
- Employee leave history and role tracking
- Half-day and full-day leave records

### Authentication & Roles
- **Admin** — full access: train RAG model, view all stores, manage data
- **Store Manager** — scoped to their store; predictions, reports, and chatbot access

### UI / UX
- Dark theme with 3D CSS animations throughout
- Frosted glass chatbot panel
- Inter font, responsive layout
- Light/dark mode toggle

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Recharts |
| Backend | Quarkus 3 (Java 21), Panache ORM |
| Database | PostgreSQL 16 |
| Vector DB | Milvus 2.3.5 (RAG embeddings) |
| AI | OpenAI `gpt-4o-mini` + `text-embedding-3-small` |
| Cache | Redis 7 |
| Analytics | Apache Superset *(planned)* |
| Infrastructure | Docker Compose |

---

## Quick Start

### Prerequisites

- Docker Desktop (8 GB RAM allocated minimum)
- Java JDK 21
- Node.js 18+

### 1. Start infrastructure

```bash
docker-compose up -d
```

### 2. Set OpenAI API key

In `backend/src/main/resources/application.properties`:

```properties
openai.api.key=YOUR_KEY_HERE
```

### 3. Start backend

```bash
cd backend
./mvnw compile quarkus:dev        # Mac/Linux
mvnw.cmd compile quarkus:dev      # Windows
```

### 4. Start frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Access

| Service | URL | Credentials |
|---|---|---|
| App | http://localhost:5173 | `admin` / `password123` |
| Backend API | http://localhost:8080/api | — |
| pgAdmin | http://localhost:5050 | `admin@ebp.com` / `admin` |
| Superset | http://localhost:8088 | `admin` / `admin` |

Manager accounts: `manager.london1`, `manager.manchester`, etc. — all use `password123`.

---

## Architecture

```
Browser (localhost:5173)
    │
    ▼
React + Vite
    │  REST → :8080/api
    ▼
Quarkus Backend (Java 21)
    ├── PostgreSQL  — employee, leave, and user data
    ├── Milvus      — RAG vector embeddings
    └── OpenAI API  — chat (gpt-4o-mini) + embeddings (text-embedding-3-small)
```

---

## Seeded Test Data

- 10 UK store locations
- 500 employees across stores
- Leave history spanning multiple years
- 1 admin account + 10 store manager accounts(will keep on expanding)

---

## Notes

- Milvus takes ~90 seconds to become healthy on first start — wait before launching the backend
- RAG chatbot requires training data: log in as admin → Chatbot → Train Data tab
- Superset analytics is planned for a future release
