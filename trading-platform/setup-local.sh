#!/bin/bash

# NovaTrade Local Setup Script

echo "🚀 Setting up NovaTrade Trading Platform locally..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Start Docker services
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if ! docker ps | grep -q novatrade-postgres; then
    echo "❌ PostgreSQL container failed to start"
    exit 1
fi

if ! docker ps | grep -q novatrade-redis; then
    echo "❌ Redis container failed to start"
    exit 1
fi

echo "✅ Docker services are running"

# Install dependencies
echo "📥 Installing dependencies..."
cd "$(dirname "$0")"
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Push database schema
echo "🗄️  Setting up database schema..."
npm run db:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Create .env files in each service directory (see DEPLOYMENT.md)"
echo "2. Run services in separate terminals:"
echo "   - npm run dev:backend"
echo "   - npm run dev:execution"
echo "   - npm run dev:events"
echo "   - npm run dev:frontend"
echo ""
echo "🌐 Services will be available at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:3001"
echo "   - WebSocket: ws://localhost:3002"
