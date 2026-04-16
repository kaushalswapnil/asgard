# EBP — Local Developer Setup

Get the project running end-to-end in under 10 minutes.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|---------|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Java JDK | 21 | https://adoptium.net/temurin/releases/?version=21 |
| Node.js | 18+ | https://nodejs.org |
| Git | Any | https://git-scm.com |

Make sure Docker Desktop is **running** before you proceed.

---

## 1. Clone the repo

```bash
git clone <repo-url>
cd EBP
```

---

## 2. Set your OpenAI API key

Open [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties) and replace the value on this line:

```properties
openai.api.key=YOUR_OPENAI_API_KEY_HERE
```

> The app uses `gpt-4o-mini` for the chatbot and `text-embedding-3-small` for RAG embeddings.
> Get a key at https://platform.openai.com/api-keys

---

## 3. Start the infrastructure (Docker)

From the project root:

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL 16** — main database (auto-seeded with test data)
- **Milvus** — vector database for RAG (includes etcd + MinIO)
- **Redis** — caching layer
- **pgAdmin** — database UI
- **Apache Superset** — analytics dashboards

Wait ~2 minutes for all services to become healthy. Check status with:

```bash
docker-compose ps
```

All services should show `running` or `healthy`. Milvus and Superset take the longest to start.

---

## 4. Start the backend

```bash
cd backend
./mvnw compile quarkus:dev
```

On Windows without WSL:

```bash
cd backend
mvnw.cmd compile quarkus:dev
```

The backend is ready when you see:

```
Listening on: http://0.0.0.0:8080
```

> Quarkus dev mode supports **live reload** — changes to Java files apply without restart.

---

## 5. Start the frontend

Open a **new terminal** in the project root:

```bash
cd frontend
npm install
npm run dev
```

The frontend is ready when you see:

```
VITE ready in Xms  ➜  Local: http://localhost:5173/
```

---

## 6. Open the app

| Service | URL | Credentials |
|---------|-----|-------------|
| **App (Frontend)** | http://localhost:5173 | admin@ebp.co.uk / admin123 |
| **Backend API** | http://localhost:8080/api | — |
| **Quarkus Dev UI** | http://localhost:8080/q/dev/ | — |
| **pgAdmin** | http://localhost:5050 | admin@ebp.com / admin |
| **Superset** | http://localhost:8088 | admin / admin |

---

## 7. Train the RAG model (optional but recommended)

The AI chatbot needs training data before it can make predictions. Once logged in:

1. Click **RAG Training** in the navbar
2. In the **Batch Training** tab, paste:
   ```
   1,2,3,4,5,10,15,20,25,30
   ```
3. Click **Train All** — takes ~5 seconds

See [START_TRAINING_NOW.md](START_TRAINING_NOW.md) for more training options and chatbot example queries.

---

## Stopping everything

```bash
# Stop Docker services (keeps data)
docker-compose down

# Stop and wipe all data (clean slate)
docker-compose down -v
```

Stop the backend and frontend with `Ctrl+C` in their respective terminals.

---

## Troubleshooting

**`docker-compose up` fails on Milvus**
Milvus needs at least 8 GB RAM allocated to Docker. Check Docker Desktop > Settings > Resources.

**Backend fails to connect to PostgreSQL**
Make sure `docker-compose up` has finished and PostgreSQL is healthy:
```bash
docker-compose ps postgres
```

**Backend fails to connect to Milvus**
Milvus has a 90-second startup window. Wait for it to be healthy before starting the backend:
```bash
docker-compose ps milvus
```

**`./mvnw: Permission denied` on Mac/Linux**
```bash
chmod +x ./mvnw
```

**Port already in use**
Check which process owns the port (e.g. 8080, 5432, 19530) and stop it, or update the port in `application.properties` / `vite.config.js`.

**OpenAI errors in the chatbot**
Verify your API key is valid and has credits. The key lives in [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties).

---

## Architecture at a glance

```
Browser (localhost:5173)
    │
    ▼
React + Vite frontend
    │  REST calls to :8080/api
    ▼
Quarkus backend (Java 21)
    ├── PostgreSQL  — employee & leave data
    ├── Milvus      — RAG vector embeddings
    └── OpenAI API  — embeddings (text-embedding-3-small)
                      chat (gpt-4o-mini)

Superset (localhost:8088) — reads from PostgreSQL for analytics
```
