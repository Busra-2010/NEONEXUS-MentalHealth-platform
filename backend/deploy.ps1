# NEONEXUS Backend Deployment Script for Windows
# Usage: .\deploy.ps1 [Environment]
# Environments: development, staging, production

param(
    [string]$Environment = "development"
)

$ProjectName = "neonexus-backend"
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting deployment for $ProjectName ($Environment)" -ForegroundColor Blue

function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Success "Node.js $nodeVersion detected"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
}

# Install dependencies
Write-Info "Installing dependencies..."
npm ci --only=production
Write-Success "Dependencies installed"

# Build the application
Write-Info "Building TypeScript application..."
npm run build
Write-Success "Application built successfully"

# Set up environment
Write-Info "Setting up environment for $Environment..."

switch ($Environment) {
    "production" {
        if (!(Test-Path ".env.production")) {
            Write-Warning "No .env.production file found. Creating from template..."
            Copy-Item ".env" ".env.production"
        }
        Copy-Item ".env.production" ".env"
        $env:NODE_ENV = "production"
        Write-Info "Production environment configured"
    }
    "staging" {
        if (!(Test-Path ".env.staging")) {
            Write-Warning "No .env.staging file found. Creating from template..."
            Copy-Item ".env" ".env.staging"
        }
        Copy-Item ".env.staging" ".env"
        $env:NODE_ENV = "staging"
        Write-Info "Staging environment configured"
    }
    "development" {
        $env:NODE_ENV = "development"
        Write-Info "Development environment configured"
    }
    default {
        Write-Error "Unknown environment: $Environment"
        Write-Info "Available environments: development, staging, production"
        exit 1
    }
}

# Create necessary directories
Write-Info "Creating necessary directories..."
$dirs = @("data", "logs", "uploads")
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
}
Write-Success "Directories created"

# Database setup
Write-Info "Setting up database..."
Write-Info "Starting server to initialize database..."
$serverProcess = Start-Process -FilePath "node" -ArgumentList "dist/server.js" -PassThru -NoNewWindow

# Wait for server to start
Start-Sleep -Seconds 5

# Check if server is running
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5
    Write-Success "Health check passed: $($response.status)"
} catch {
    Write-Warning "Health check failed (server may still be starting)"
}

# Stop the initialization server
if ($serverProcess -and !$serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force
    Write-Info "Database initialization complete"
}

Write-Success "Database setup complete"

# Set up Windows Service for production
if ($Environment -eq "production") {
    Write-Info "Production deployment notes:"
    Write-Host "  • Consider using PM2 with: npm install -g pm2" -ForegroundColor Cyan
    Write-Host "  • Or set up as Windows Service with NSSM" -ForegroundColor Cyan
    Write-Host "  • Start with: npm start" -ForegroundColor Cyan
} else {
    Write-Info "Development/Staging deployment complete"
    Write-Info "Start the server with: npm run dev"
}

Write-Success "🎉 Deployment completed successfully!"
Write-Info "📚 API Documentation: API_DOCUMENTATION.md"
Write-Info "🌐 Health Check: http://localhost:5000/api/health"

# Display next steps
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update environment variables in .env file"
Write-Host "2. Configure database connection (if using PostgreSQL)"
Write-Host "3. Set up SSL certificate for HTTPS"
Write-Host "4. Configure reverse proxy (IIS/nginx)"
Write-Host "5. Set up monitoring and logging"
Write-Host ""
Write-Host "📖 For detailed setup instructions, see README.md"