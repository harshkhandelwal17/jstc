#!/bin/bash

# Multi-Coaching Management System - Deployment Script
# This script helps deploy the application in different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Check if environment files exist
check_env_files() {
    if [ ! -f "./backend/.env" ]; then
        print_warning "Backend .env file not found. Copying from example..."
        cp "./backend/.env.example" "./backend/.env"
        print_info "Please edit ./backend/.env with your configuration"
    fi
}

# Development deployment
deploy_development() {
    print_info "Starting development deployment..."
    
    # Install dependencies
    print_info "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    print_info "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    # Start development servers
    print_info "Starting development servers..."
    echo "Backend will start on http://localhost:3001"
    echo "Frontend will start on http://localhost:5173"
    echo ""
    print_warning "Open two separate terminals and run:"
    echo "Terminal 1: cd backend && npm run dev"
    echo "Terminal 2: cd frontend && npm run dev"
    
    print_success "Development environment setup complete!"
}

# Docker deployment
deploy_docker() {
    print_info "Starting Docker deployment..."
    
    check_docker
    check_env_files
    
    # Build and start containers
    print_info "Building and starting Docker containers..."
    docker-compose down --remove-orphans
    docker-compose up -d --build
    
    print_info "Waiting for services to be ready..."
    sleep 15
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Services are running!"
        print_info "Application is available at:"
        echo "  🌐 Frontend: http://localhost"
        echo "  🔌 Backend API: http://localhost/api"
        echo "  💾 MongoDB: mongodb://localhost:27017"
        echo ""
        print_info "To view logs: docker-compose logs -f"
        print_info "To stop: docker-compose down"
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Production deployment
deploy_production() {
    print_info "Starting production deployment..."
    
    check_docker
    check_env_files
    
    # Verify environment variables
    print_info "Checking production environment variables..."
    if grep -q "your-secret-key" "./backend/.env"; then
        print_error "Please update JWT_SECRET in ./backend/.env for production!"
        exit 1
    fi
    
    # Build and start production containers
    print_info "Building production containers..."
    docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d --build
    
    print_success "Production deployment complete!"
    print_info "Don't forget to:"
    echo "  🔒 Set up SSL certificates"
    echo "  🔥 Configure firewall rules"
    echo "  📊 Set up monitoring"
    echo "  💾 Configure database backups"
}

# Health check
health_check() {
    print_info "Performing health check..."
    
    # Check backend health
    if curl -f -s http://localhost:3001/health > /dev/null; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend (if running on port 5173)
    if curl -f -s http://localhost:5173 > /dev/null; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend not accessible on port 5173"
    fi
    
    print_success "Health check complete!"
}

# Backup database
backup_database() {
    print_info "Creating database backup..."
    
    BACKUP_DIR="./backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/coaching_management_${TIMESTAMP}.gz"
    
    mkdir -p "$BACKUP_DIR"
    
    if command -v mongodump &> /dev/null; then
        mongodump --uri="mongodb://localhost:27017/coaching_management" --archive="$BACKUP_FILE" --gzip
        print_success "Database backup created: $BACKUP_FILE"
    else
        print_error "mongodump not found. Please install MongoDB tools."
        exit 1
    fi
}

# Show usage
show_usage() {
    echo "Multi-Coaching Management System - Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev         Set up development environment"
    echo "  docker      Deploy using Docker Compose"
    echo "  production  Deploy for production"
    echo "  health      Perform health check"
    echo "  backup      Backup database"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 docker"
    echo "  $0 production"
    echo ""
}

# Main script logic
case "$1" in
    "dev"|"development")
        deploy_development
        ;;
    "docker")
        deploy_docker
        ;;
    "production"|"prod")
        deploy_production
        ;;
    "health"|"check")
        health_check
        ;;
    "backup")
        backup_database
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Invalid command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac