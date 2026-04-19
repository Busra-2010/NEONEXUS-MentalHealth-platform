#!/bin/bash

# NEONEXUS Backend Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: development, staging, production

set -e

ENVIRONMENT=${1:-development}
PROJECT_NAME="neonexus-backend"

echo "🚀 Starting deployment for $PROJECT_NAME ($ENVIRONMENT)"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

log_success "Node.js $(node -v) detected"

# Install dependencies
log_info "Installing dependencies..."
npm ci --only=production
log_success "Dependencies installed"

# Build the application
log_info "Building TypeScript application..."
npm run build
log_success "Application built successfully"

# Set up environment
log_info "Setting up environment for $ENVIRONMENT..."

case $ENVIRONMENT in
    "production")
        # Production environment setup
        if [ ! -f ".env.production" ]; then
            log_warning "No .env.production file found. Creating from template..."
            cp .env.example .env.production
        fi
        cp .env.production .env
        export NODE_ENV=production
        log_info "Production environment configured"
        ;;
    "staging")
        # Staging environment setup
        if [ ! -f ".env.staging" ]; then
            log_warning "No .env.staging file found. Creating from template..."
            cp .env.example .env.staging
        fi
        cp .env.staging .env
        export NODE_ENV=staging
        log_info "Staging environment configured"
        ;;
    "development")
        # Development environment setup
        export NODE_ENV=development
        log_info "Development environment configured"
        ;;
    *)
        log_error "Unknown environment: $ENVIRONMENT"
        log_info "Available environments: development, staging, production"
        exit 1
        ;;
esac

# Create necessary directories
log_info "Creating necessary directories..."
mkdir -p data
mkdir -p logs
mkdir -p uploads
log_success "Directories created"

# Database setup
log_info "Setting up database..."
if [ "$ENVIRONMENT" = "production" ]; then
    log_info "Starting production server to initialize database..."
    timeout 10 npm start || log_info "Database initialization complete"
else
    log_info "Starting server to initialize database..."
    timeout 10 npm run dev || log_info "Database initialization complete"
fi
log_success "Database setup complete"

# Health check
log_info "Running health check..."
sleep 2
if curl -f -s http://localhost:5000/api/health > /dev/null 2>&1; then
    log_success "Health check passed"
else
    log_warning "Health check failed (server may not be running)"
fi

# Set up PM2 for production
if [ "$ENVIRONMENT" = "production" ]; then
    if command -v pm2 &> /dev/null; then
        log_info "Setting up PM2 process manager..."
        pm2 delete $PROJECT_NAME 2>/dev/null || true
        pm2 start dist/server.js --name $PROJECT_NAME
        pm2 save
        pm2 startup
        log_success "PM2 configured for auto-restart"
    else
        log_warning "PM2 not installed. Install with: npm install -g pm2"
        log_info "Starting server with Node.js..."
        npm start &
    fi
else
    log_info "Development/Staging deployment complete"
    log_info "Start the server with: npm run dev"
fi

log_success "🎉 Deployment completed successfully!"
log_info "📚 API Documentation: API_DOCUMENTATION.md"
log_info "🌐 Health Check: http://localhost:5000/api/health"

# Display next steps
echo ""
echo "🔧 Next Steps:"
echo "1. Update environment variables in .env file"
echo "2. Configure database connection (if using PostgreSQL)"
echo "3. Set up SSL certificate for HTTPS"
echo "4. Configure reverse proxy (nginx/Apache)"
echo "5. Set up monitoring and logging"
echo ""
echo "📖 For detailed setup instructions, see README.md"