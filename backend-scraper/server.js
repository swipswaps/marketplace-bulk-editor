/**
 * Scraper Backend Server
 * ----------------------
 * Express server that provides scraping endpoints for the frontend
 * 
 * Endpoints:
 * - GET /health - Health check
 * - POST /scrape - Scrape listings from a URL
 * 
 * CORS enabled to allow frontend access
 */

import express from 'express';
import cors from 'cors';
import { scrapeListings } from './scraper.js';

const app = express();
const PORT = 5001; // Different port from main backend (5000)

// Enable CORS for frontend access
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://swipswaps.github.io'],
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'marketplace-scraper',
    timestamp: new Date().toISOString()
  });
});

/**
 * Scrape endpoint
 * 
 * POST /scrape
 * Body: {
 *   url: string,
 *   source: "eBay" | "Facebook Marketplace" | "Amazon" | "Salvex"
 * }
 * 
 * Returns: {
 *   success: boolean,
 *   listings: Array<Listing>,
 *   count: number,
 *   error?: string
 * }
 */
app.post('/scrape', async (req, res) => {
  const { url, source } = req.body;

  // Validate request
  if (!url || !source) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: url and source'
    });
  }

  const validSources = ['eBay', 'Facebook Marketplace', 'Amazon', 'Salvex'];
  if (!validSources.includes(source)) {
    return res.status(400).json({
      success: false,
      error: `Invalid source. Must be one of: ${validSources.join(', ')}`
    });
  }

  console.log(`📥 Scrape request: ${source} - ${url}`);

  try {
    // Scrape listings
    const listings = await scrapeListings(url, source, (progress) => {
      console.log(`📊 Progress: Page ${progress.page}, Found ${progress.listingsFound} listings`);
    });

    console.log(`✅ Scrape complete: ${listings.length} listings`);

    res.json({
      success: true,
      listings,
      count: listings.length
    });

  } catch (error) {
    console.error('❌ Scrape error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Scraping failed',
      count: 0,
      listings: []
    });
  }
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 Marketplace Scraper Backend                           ║
║                                                            ║
║  Server running on: http://localhost:${PORT}                 ║
║  Health check: http://localhost:${PORT}/health              ║
║                                                            ║
║  Supported sites:                                          ║
║  - eBay                                                    ║
║  - Facebook Marketplace                                    ║
║  - Amazon                                                  ║
║  - Salvex                                                  ║
╚════════════════════════════════════════════════════════════╝
  `);
});

