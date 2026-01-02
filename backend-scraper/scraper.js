/**
 * Multi-Site Scraper with Playwright
 * -----------------------------------
 * Scrapes product listings from eBay, Facebook Marketplace, Amazon, and custom sites
 *
 * Features:
 * - Site-specific selectors for major platforms (eBay, Amazon, Facebook)
 * - Generic table scraper for custom sites (uses table row pattern)
 * - Rate limiting to prevent blocking
 * - Retry logic with exponential backoff
 * - Returns standardized listing format
 *
 * Based on working patterns from production scrapers
 */

import { chromium } from "playwright";

/**
 * Site-specific rate limits (milliseconds between requests)
 * These prevent IP blocking and respect site policies
 */
const RATE_LIMITS = {
  "Facebook Marketplace": 5000, // 5 seconds
  "eBay": 3000,                 // 3 seconds
  "Amazon": 4000,               // 4 seconds
  "Salvex": 2000                // 2 seconds
  // Custom sites use default 3 seconds
};

/**
 * Retry configuration
 */
const MAX_RETRIES = 3;

/**
 * Scrape listings from a URL with site-specific logic
 *
 * @param {string} url - The search URL to scrape
 * @param {string} source - Site name (eBay, Facebook Marketplace, Amazon, or custom site name)
 * @param {function} onProgress - Optional callback for progress updates
 * @returns {Promise<Array>} Array of listing objects
 */
export async function scrapeListings(url, source, onProgress = null) {
  console.log(`🔍 Starting scrape: ${source} - ${url}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  const allListings = [];
  let pageNumber = 1;
  let nextPageUrl = url;

  /**
   * Retry helper with exponential backoff
   */
  async function fetchPageWithRetries(url, retriesLeft) {
    try {
      await page.goto(url, { 
        waitUntil: "domcontentloaded", 
        timeout: 30000 
      });
      return true;
    } catch (err) {
      if (retriesLeft > 0) {
        const backoff = 2000 * Math.pow(2, MAX_RETRIES - retriesLeft);
        console.warn(`⚠️ Retrying ${url} in ${backoff}ms (${retriesLeft} retries left)`);
        await new Promise(r => setTimeout(r, backoff));
        return fetchPageWithRetries(url, retriesLeft - 1);
      } else {
        console.error(`❌ Failed to load ${url} after ${MAX_RETRIES} retries`);
        return false;
      }
    }
  }

  // Scrape pages until no more results
  while (nextPageUrl && pageNumber <= 5) { // Limit to 5 pages for safety
    // Respect rate limit
    if (pageNumber > 1) {
      const delay = RATE_LIMITS[source] || 3000;
      console.log(`⏳ Waiting ${delay}ms before next page...`);
      await new Promise(r => setTimeout(r, delay));
    }

    // Load page with retries
    const loaded = await fetchPageWithRetries(nextPageUrl, MAX_RETRIES);
    if (!loaded) break;

    console.log(`📄 Scraping page ${pageNumber}...`);

    let listings = [];

    try {
      // Site-specific scraping logic
      if (source === "eBay") {
        listings = await scrapeEbay(page);
      } else if (source === "Facebook Marketplace") {
        listings = await scrapeFacebookMarketplace(page);
      } else if (source === "Amazon") {
        listings = await scrapeAmazon(page);
      } else if (source === "Salvex") {
        listings = await scrapeGenericTable(page);
      } else {
        // Use generic table scraper for custom sites
        listings = await scrapeGenericTable(page);
      }

      console.log(`✅ Found ${listings.length} listings on page ${pageNumber}`);
      allListings.push(...listings);

      // Report progress
      if (onProgress) {
        onProgress({
          page: pageNumber,
          listingsFound: listings.length,
          totalListings: allListings.length
        });
      }

      // Check for next page (simplified - would need site-specific logic)
      nextPageUrl = null; // For now, only scrape first page

    } catch (err) {
      console.error(`❌ Error scraping page ${pageNumber}:`, err.message);
      break;
    }

    pageNumber++;
  }

  await browser.close();
  
  console.log(`✅ Scraping complete: ${allListings.length} total listings`);
  return allListings;
}

/**
 * Scrape eBay search results
 */
async function scrapeEbay(page) {
  // Wait for page to load and try multiple selectors
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch (e) {
    console.log('⚠️ Network not idle, continuing anyway');
  }

  // Take screenshot for debugging
  await page.screenshot({ path: '/tmp/ebay-debug.png' });
  console.log('📸 Screenshot saved to /tmp/ebay-debug.png');

  // Try to find items with more flexible selector
  const items = await page.$$('.s-item, [data-testid="s-item"], .srp-results .s-item');

  if (items.length === 0) {
    console.log('❌ No items found with any selector');
    return [];
  }

  console.log(`✅ Found ${items.length} items on page`);

  return await page.$$eval('.s-item', items => {
    return items.slice(0, 20).map(item => {
      const titleEl = item.querySelector('.s-item__title');
      const priceEl = item.querySelector('.s-item__price');
      const locationEl = item.querySelector('.s-item__location');

      return {
        TITLE: titleEl?.textContent?.trim() || '',
        PRICE: priceEl?.textContent?.replace(/[^0-9.]/g, '') || '',
        CONDITION: 'Used - Good', // eBay doesn't always show condition in search
        DESCRIPTION: titleEl?.textContent?.trim() || '',
        CATEGORY: 'General',
        'OFFER SHIPPING': 'Yes'
      };
    }).filter(item => item.TITLE && item.TITLE !== 'Shop on eBay');
  });
}

/**
 * Scrape Facebook Marketplace search results
 */
async function scrapeFacebookMarketplace(page) {
  // Wait for page to load
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch (e) {
    console.log('⚠️ Network not idle, continuing anyway');
  }

  // Take screenshot for debugging
  await page.screenshot({ path: '/tmp/facebook-debug.png' });
  console.log('📸 Screenshot saved to /tmp/facebook-debug.png');

  // Facebook often requires login - check for that
  const loginRequired = await page.$('input[name="email"]');
  if (loginRequired) {
    console.log('❌ Facebook requires login - cannot scrape without authentication');
    return [];
  }

  // Try to find items
  const items = await page.$$('div[data-testid="marketplace_feed_item"], [role="article"]');

  if (items.length === 0) {
    console.log('❌ No items found with any selector');
    return [];
  }

  console.log(`✅ Found ${items.length} items on page`);

  return await page.$$eval('div[data-testid="marketplace_feed_item"]', items => {
    return items.slice(0, 20).map(item => {
      const titleEl = item.querySelector('span');
      const priceEl = item.querySelector('span[dir="auto"]');

      return {
        TITLE: titleEl?.textContent?.trim() || '',
        PRICE: priceEl?.textContent?.replace(/[^0-9.]/g, '') || '',
        CONDITION: 'Used - Good',
        DESCRIPTION: titleEl?.textContent?.trim() || '',
        CATEGORY: 'General',
        'OFFER SHIPPING': 'No'
      };
    }).filter(item => item.TITLE);
  });
}

/**
 * Scrape Amazon search results
 */
async function scrapeAmazon(page) {
  // Wait for page to load
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch (e) {
    console.log('⚠️ Network not idle, continuing anyway');
  }

  // Take screenshot for debugging
  await page.screenshot({ path: '/tmp/amazon-debug.png' });
  console.log('📸 Screenshot saved to /tmp/amazon-debug.png');

  // Try to find items
  const items = await page.$$('.s-result-item, [data-component-type="s-search-result"]');

  if (items.length === 0) {
    console.log('❌ No items found with any selector');
    return [];
  }

  console.log(`✅ Found ${items.length} items on page`);

  return await page.$$eval('.s-result-item[data-component-type="s-search-result"]', items => {
    return items.slice(0, 20).map(item => {
      const titleEl = item.querySelector('h2 a span');
      const priceEl = item.querySelector('.a-price span.a-offscreen');

      return {
        TITLE: titleEl?.textContent?.trim() || '',
        PRICE: priceEl?.textContent?.replace(/[^0-9.]/g, '') || '',
        CONDITION: 'New',
        DESCRIPTION: titleEl?.textContent?.trim() || '',
        CATEGORY: 'General',
        'OFFER SHIPPING': 'Yes'
      };
    }).filter(item => item.TITLE);
  });
}

/**
 * Generic table scraper for custom sites
 *
 * This uses the same pattern as the Salvex scraper:
 * - Looks for table rows (tr)
 * - Extracts data from table cells (td)
 * - Works for any table-based listing site
 *
 * This is a fallback scraper for custom sites that the user adds.
 */
async function scrapeGenericTable(page) {
  try {
    // Try to find table rows
    await page.waitForSelector('tr', { timeout: 10000 });

    return await page.$$eval('tr', rows => {
      return rows.slice(1, 21).map(row => { // Skip header row, max 20 items
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return null; // Need at least 2 columns

        // Extract text from first few cells
        const cell0 = cells[0]?.textContent?.trim() || '';
        const cell1 = cells[1]?.textContent?.trim() || '';
        const cell2 = cells[2]?.textContent?.trim() || '';

        // Try to identify which cell has the price (contains $ or numbers)
        let title = cell0;
        let price = '';

        if (cell1.match(/\$|[0-9]+\.[0-9]{2}/)) {
          price = cell1.replace(/[^0-9.]/g, '');
        } else if (cell2.match(/\$|[0-9]+\.[0-9]{2}/)) {
          price = cell2.replace(/[^0-9.]/g, '');
        }

        return {
          TITLE: title,
          PRICE: price || '0',
          CONDITION: 'Used - Good',
          DESCRIPTION: title,
          CATEGORY: 'General',
          'OFFER SHIPPING': 'Yes'
        };
      }).filter(item => item && item.TITLE);
    });
  } catch (err) {
    console.warn('Generic table scraper failed, trying alternative selectors...');

    // Fallback: try to find any links or product cards
    try {
      await page.waitForSelector('a', { timeout: 5000 });

      return await page.$$eval('a', links => {
        return links.slice(0, 20).map(link => {
          const text = link.textContent?.trim() || '';
          if (text.length < 10) return null; // Skip short links

          return {
            TITLE: text,
            PRICE: '0',
            CONDITION: 'Used - Good',
            DESCRIPTION: text,
            CATEGORY: 'General',
            'OFFER SHIPPING': 'Yes'
          };
        }).filter(item => item && item.TITLE);
      });
    } catch (err2) {
      console.error('All scraping methods failed');
      return [];
    }
  }
}

