# Quick Start Guide

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- Docker Desktop (for PostgreSQL and Redis)

### Step 1: Start Infrastructure

```bash
cd trading-platform
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create `.env` files in each service directory:

#### `apps/backend/.env`
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/novatrade
REDIS_URL=redis://localhost:6379
JWT_SECRET=novatrade-jwt-secret-key-2024
ENCRYPTION_KEY=novatrade-encryption-key-32!!
PORT=3001
```

#### `apps/execution-service/.env`
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/novatrade
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=novatrade-encryption-key-32!!
BINANCE_TESTNET_URL=https://testnet.binance.vision
```

#### `apps/event-service/.env`
```env
REDIS_URL=redis://localhost:6379
JWT_SECRET=novatrade-jwt-secret-key-2024
WS_PORT=3002
BINANCE_WS_URL=wss://stream.testnet.binance.vision
```

#### `apps/frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3002
```

**Important:** 
- `ENCRYPTION_KEY` must be exactly 32 characters
- Use the same `JWT_SECRET` and `ENCRYPTION_KEY` across backend and event-service

### Step 4: Set Up Database

The database schema has been pre-created. If you need to recreate it:

```bash
# Generate Prisma client
npm run db:generate

# Database tables are already created, but if needed:
docker exec -i novatrade-postgres psql -U postgres -d novatrade < apps/backend/init-db.sql
```

### Step 5: Run Services

Open **four separate terminals**:

**Terminal 1 - Backend API:**
```bash
npm run dev:backend
```
Should show: `🚀 Backend API Gateway running on port 3001`

**Terminal 2 - Execution Service:**
```bash
npm run dev:execution
```
Should show: `🚀 Execution Service listening for order commands...`

**Terminal 3 - Event Service (WebSocket):**
```bash
npm run dev:events
```
Should show: `🚀 WebSocket server running on port 3002`

**Terminal 4 - Frontend:**
```bash
npm run dev:frontend
```
Should show: `Ready on http://localhost:3000`

### Step 6: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **WebSocket:** ws://localhost:3002

### Testing

1. Open http://localhost:3000
2. Register a new account with your Binance Testnet API keys
3. Login and start trading!

---

## 🛑 Stopping Services

```bash
# Stop all services (Ctrl+C in each terminal)
# Stop Docker containers
docker-compose down

# Or stop and remove volumes
docker-compose down -v
```

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Find and kill process on port
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

### Docker containers not starting
```bash
# Check Docker is running
docker ps

# Restart containers
docker-compose restart
```

### Database connection errors
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
docker exec novatrade-postgres psql -U postgres -d novatrade -c "SELECT 1;"
```

### Redis connection errors
```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connection
docker exec novatrade-redis redis-cli ping
```

---

## 📝 Next Steps

- See [DEPLOYMENT.md](./DEPLOYMENT.md) for deploying to Render and Vercel
- Get Binance Testnet API keys from: https://testnet.binance.vision
