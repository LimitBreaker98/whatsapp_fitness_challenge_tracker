# Fitness Challenge Tracker V2

A web-based leaderboard for tracking a WhatsApp fitness challenge.

## Project Structure

```
whatsapp_fitness_challenge_tracker/
├── backend/           # Python FastAPI server
│   ├── main.py        # API endpoints
│   ├── parser.py      # Message parsing logic
│   ├── storage.py     # JSON file read/write
│   ├── data.json      # Data storage (created on first write)
│   ├── requirements.txt
│   └── venv/          # Python virtual environment
├── frontend/          # React app (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── components/
│   └── package.json
├── design.md          # Architecture design document
└── README.md          # This file
```

## Quick Start

### 1. Start Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --port 8000
```

Backend runs at: http://localhost:8000

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: http://localhost:5173

### 3. Access the App

| Page | URL |
|------|-----|
| Dashboard | http://localhost:5173 |
| Admin | http://localhost:5173/admin?key=dev-secret-key |
| API Docs | http://localhost:8000/docs |

---

## Backend Setup (First Time)

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Frontend Setup (First Time)

```bash
cd frontend

# Install dependencies
npm install
```

---

## Testing

### Test Backend Only

Start the backend, then use curl to test endpoints:

```bash
# Health check
curl http://localhost:8000/api/health

# Get all scores
curl http://localhost:8000/api/scores

# Get latest scores with daily gains
curl http://localhost:8000/api/latest

# Submit a daily update
curl -X POST http://localhost:8000/api/update \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-secret-key" \
  -d '{"message": "January 15\nPepo: 10\nMene: 8\nJosh: 7\nPocho: 5"}'
```

### Test Frontend Only

```bash
cd frontend
npm run dev
```

Note: Frontend will show errors if backend isn't running.

### Test Full Stack

1. **Terminal 1 - Start Backend:**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --port 8000
   ```

2. **Terminal 2 - Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Terminal 3 - Add Test Data:**
   ```bash
   # Add sample entries
   curl -X POST http://localhost:8000/api/update \
     -H "Content-Type: application/json" \
     -H "X-API-Key: dev-secret-key" \
     -d '{"message": "January 1\nPepo: 1\nMene: 0\nJosh: 0\nPocho: 0"}'

   curl -X POST http://localhost:8000/api/update \
     -H "Content-Type: application/json" \
     -H "X-API-Key: dev-secret-key" \
     -d '{"message": "January 2\nPepo: 2\nMene: 1\nJosh: 1\nPocho: 1"}'

   curl -X POST http://localhost:8000/api/update \
     -H "Content-Type: application/json" \
     -H "X-API-Key: dev-secret-key" \
     -d '{"message": "January 3\nPepo: 3\nMene: 2\nJosh: 2\nPocho: 1"}'
   ```

4. **Open browser:** http://localhost:5173

---

## API Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | None |
| GET | `/api/scores` | Get all entries | None |
| GET | `/api/latest` | Get latest day + daily gains | None |
| POST | `/api/update` | Submit daily update | `X-API-Key` header |

### Message Format

```
January 15
Pepo: 10
Mene: 8
Josh: 7
Pocho: 5
```

- First line: Date (e.g., "January 15", "Jan 15")
- Following lines: `PlayerName: CumulativeScore`

---

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `API_KEY` | `dev-secret-key` | API key for POST /api/update |

**Generating a secure API key:**

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Using the API key:**

```bash
# Option 1: Inline
API_KEY=your-secure-key uvicorn main:app --port 8000

# Option 2: Export first
export API_KEY=your-secure-key
uvicorn main:app --port 8000
```

**For production:** Set `API_KEY` as an environment variable in your hosting platform (Render, Fly.io, etc.). Never commit secrets to git.

See `backend/.env.example` for reference.

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL |

---

## Troubleshooting

### Port already in use

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Reset data

```bash
rm backend/data.json
```

### Check if servers are running

```bash
# Check backend
curl http://localhost:8000/api/health

# Check frontend
curl -I http://localhost:5173
```
