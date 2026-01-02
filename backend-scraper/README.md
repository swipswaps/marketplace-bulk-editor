# Marketplace Scraper Backend

Playwright-based scraper for eBay, Facebook Marketplace, Amazon, and Salvex.

## Features

- **Multi-site support**: eBay, Facebook Marketplace, Amazon, Salvex
- **Rate limiting**: Prevents IP blocking
- **Retry logic**: Exponential backoff for failed requests
- **Standardized output**: Returns Facebook Marketplace format
- **Progress tracking**: Real-time scraping progress

## Quick Start

### 1. Install Dependencies

```bash
cd backend-scraper
npm install
npx playwright install chromium
```

### 2. Start Server

```bash
npm start
# OR
./start.sh
```

Server runs on **http://localhost:5001**

### 3. Test Health Check

```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "marketplace-scraper",
  "timestamp": "2025-12-30T..."
}
```

## API Endpoints

### POST /scrape

Scrape listings from a URL.

**Request:**
```json
{
  "url": "https://www.ebay.com/sch/i.html?_nkw=solar+panels",
  "source": "eBay"
}
```

**Valid sources:**
- `"eBay"`
- `"Facebook Marketplace"`
- `"Amazon"`
- `"Salvex"`

**Response:**
```json
{
  "success": true,
  "listings": [
    {
      "TITLE": "Solar Panel 300W",
      "PRICE": "150",
      "CONDITION": "New",
      "DESCRIPTION": "Solar Panel 300W",
      "CATEGORY": "General",
      "OFFER SHIPPING": "Yes"
    }
  ],
  "count": 1
}
```

## Usage from Frontend

The frontend has a "Search Sites" button that opens a modal where users can:

1. Select a site (eBay, Facebook Marketplace, Amazon, Salvex)
2. Paste a search URL from that site
3. Click "Search & Import"
4. Scraped listings are imported into the editor

## How to Get Search URLs

### eBay
1. Go to https://www.ebay.com
2. Search for items (e.g., "solar panels")
3. Copy the URL from your browser
4. Example: `https://www.ebay.com/sch/i.html?_nkw=solar+panels`

### Facebook Marketplace
1. Go to https://www.facebook.com/marketplace
2. Search or browse categories
3. Copy the URL from your browser
4. Example: `https://www.facebook.com/marketplace/category/...`

### Amazon
1. Go to https://www.amazon.com
2. Search for items
3. Copy the URL from your browser
4. Example: `https://www.amazon.com/s?k=solar+panels`

### Salvex
1. Go to https://www.salvex.com
2. Search for items
3. Copy the URL from your browser
4. Example: `https://www.salvex.com/listings/index.cfm?keyword=...`

## Rate Limits

To prevent IP blocking, the scraper enforces delays between requests:

- **Facebook Marketplace**: 5 seconds
- **eBay**: 3 seconds
- **Amazon**: 4 seconds
- **Salvex**: 2 seconds

## Retry Logic

Failed requests are retried up to 3 times with exponential backoff:
- 1st retry: 2 seconds
- 2nd retry: 4 seconds
- 3rd retry: 8 seconds

## Limitations

- **Page limit**: Maximum 5 pages per scrape (for safety)
- **Results per page**: Maximum 20 listings per page
- **Headless mode**: Runs in headless mode for performance
- **Site changes**: Selectors may break if sites update their HTML

## Troubleshooting

### "Failed to fetch" error in frontend

**Cause**: Scraper backend not running

**Solution**:
```bash
cd backend-scraper
./start.sh
```

### "Scraping failed" error

**Cause**: Site selectors may have changed, or site is blocking requests

**Solution**:
- Check console logs for specific error
- Try a different search URL
- Wait a few minutes and try again (rate limiting)

### Playwright browser not found

**Cause**: Chromium browser not installed

**Solution**:
```bash
npx playwright install chromium
```

## Development

### File Structure

```
backend-scraper/
├── package.json       # Dependencies
├── server.js          # Express server
├── scraper.js         # Playwright scraping logic
├── start.sh           # Start script
└── README.md          # This file
```

### Adding New Sites

To add support for a new site:

1. Add site to `RATE_LIMITS` in `scraper.js`
2. Create a new scraper function (e.g., `scrapeNewSite()`)
3. Add site to the `if/else` chain in `scrapeListings()`
4. Add site to `SITES` array in `src/components/SearchImport.tsx`

## License

MIT

