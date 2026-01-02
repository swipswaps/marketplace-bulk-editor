#!/bin/bash

# Marketplace Scraper Backend - Start Script
# ------------------------------------------
# Installs dependencies and starts the scraper server

echo "🚀 Starting Marketplace Scraper Backend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  
  echo "🌐 Installing Playwright browsers..."
  npx playwright install chromium
fi

# Start server
echo "▶️  Starting server on port 5001..."
npm start

