# Deployment Guide

This guide covers deploying the NovaTrade Trading Platform to Render (backend services) and Vercel (frontend).

## 🏗️ Architecture Overview

The platform consists of:
- **Backend API** (Express.js) - Port 3001
- **Execution Service** (Worker) - Processes orders
- **Event Service** (WebSocket) - Port 3002
- **Frontend** (Next.js) - Port 3000

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- Binance Testnet API keys
- Render account
- Vercel account

---

## 🚀 Local Setup

### 1. Install Dependencies

```bash
cd trading-platform
npm install
```

### 2. Start Infrastructure (Docker)

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Create Environment Files

Create `.env` files in each service directory:

#### `apps/backend/.env`
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/novatrade
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
ENCRYPTION_KEY=your-32-char-encryption-key-here!!
PORT=3001
```

#### `apps/execution-service/.env`
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/novatrade
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=your-32-char-encryption-key-here!!
BINANCE_TESTNET_URL=https://testnet.binance.vision
```

#### `apps/event-service/.env`
```env
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
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

### 4. Set Up Database

```bash
npm run db:generate
npm run db:push
```

### 5. Run Services Locally

Open **four terminals**:

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Execution Service:**
```bash
npm run dev:execution
```

**Terminal 3 - Event Service:**
```bash
npm run dev:events
```

**Terminal 4 - Frontend:**
```bash
npm run dev:frontend
```

The application should now be running:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- WebSocket: ws://localhost:3002

---

## 🌐 Render Deployment (Backend Services)

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - Name: `novatrade-db`
   - Database: `novatrade`
   - User: `novatrade`
   - Region: Choose closest to you
4. Copy the **Internal Database URL** (for services in same region)
5. Copy the **External Database URL** (for local access)

### Step 2: Create Redis Instance

1. Click "New +" → "Redis"
2. Configure:
   - Name: `novatrade-redis`
   - Region: Same as PostgreSQL
3. Copy the **Internal Redis URL**

### Step 3: Deploy Backend API

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name:** `novatrade-backend`
   - **Root Directory:** `trading-platform/apps/backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Starter ($7/month)
4. Add Environment Variables:
   ```
   DATABASE_URL=<Internal PostgreSQL URL>
   REDIS_URL=<Internal Redis URL>
   JWT_SECRET=<Generate a strong random string>
   ENCRYPTION_KEY=<32 character string>
   PORT=10000
   ```
5. Click "Create Web Service"

### Step 4: Deploy Execution Service

1. Click "New +" → "Background Worker"
2. Connect same GitHub repository
3. Configure:
   - **Name:** `novatrade-execution`
   - **Root Directory:** `trading-platform/apps/execution-service`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Starter ($7/month)
4. Add Environment Variables:
   ```
   DATABASE_URL=<Internal PostgreSQL URL>
   REDIS_URL=<Internal Redis URL>
   ENCRYPTION_KEY=<Same as backend>
   BINANCE_TESTNET_URL=https://testnet.binance.vision
   ```
5. Click "Create Background Worker"

### Step 5: Deploy Event Service (WebSocket)

1. Click "New +" → "Web Service"
2. Connect same GitHub repository
3. Configure:
   - **Name:** `novatrade-events`
   - **Root Directory:** `trading-platform/apps/event-service`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Starter ($7/month)
4. Add Environment Variables:
   ```
   REDIS_URL=<Internal Redis URL>
   JWT_SECRET=<Same as backend>
   WS_PORT=10000
   BINANCE_WS_URL=wss://stream.testnet.binance.vision
   ```
5. Click "Create Web Service"

### Step 6: Run Database Migrations

After backend is deployed, run migrations:

1. Go to backend service → "Shell" tab
2. Run:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Step 7: Get Service URLs

Note down the URLs:
- Backend API: `https://novatrade-backend.onrender.com`
- Event Service: `https://novatrade-events.onrender.com`

---

## ▲ Vercel Deployment (Frontend)

### Step 1: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `trading-platform/apps/frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://novatrade-backend.onrender.com
   NEXT_PUBLIC_WS_URL=wss://novatrade-events.onrender.com
   ```
   **Note:** Use `wss://` (secure WebSocket) for production
6. Click "Deploy"

### Step 2: Update WebSocket URL

After deployment, update the WebSocket URL in your frontend code if needed. The `useWebSocket.ts` hook should automatically use `NEXT_PUBLIC_WS_URL`.

---

## 🔧 Post-Deployment Checklist

- [ ] All services are running on Render
- [ ] Frontend is deployed on Vercel
- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] WebSocket connection uses `wss://` (secure)
- [ ] Test user registration and login
- [ ] Test order placement
- [ ] Verify real-time updates via WebSocket

---

## 🐛 Troubleshooting

### Backend won't start
- Check DATABASE_URL is correct
- Verify Redis connection
- Check logs in Render dashboard

### WebSocket connection fails
- Ensure Event Service is running
- Use `wss://` for production (not `ws://`)
- Check CORS settings if needed

### Database connection errors
- Use Internal Database URL for services on Render
- Verify database is running
- Check network restrictions

### Build failures
- Ensure all dependencies are in package.json
- Check Node.js version (18+)
- Review build logs in Render/Vercel

---

## 📝 Notes

- **Cost:** ~$21/month for Render (3 services × $7) + Vercel (free tier)
- **Scaling:** Upgrade Render plans for higher traffic
- **Security:** Use strong, unique secrets in production
- **Monitoring:** Use Render logs and Vercel analytics

---

## 🔗 Quick Links

- [Render Dashboard](https://dashboard.render.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Binance Testnet](https://testnet.binance.vision)
