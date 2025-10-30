import express from 'express';
import {
  rssSync,
  forceSync,
  getSyncStatus,
  startCronJob,
  stopCronJob,
} from '../controllers/rssController.js';

const router = express.Router();

// GET /api/rss/status - Get RSS sync status
router.get('/status', getSyncStatus);

// POST /api/rss/sync - Trigger RSS sync manually
router.post('/sync', forceSync);

// GET /api/rss/test - Test RSS feed parsing (for development)
router.get('/test', async (req, res) => {
  try {
    const { fetchRSSFeed, extractNewsItems } = await import('../utils/rssSync.js');

    const feed = await fetchRSSFeed();
    const articles = extractNewsItems(feed);

    res.status(200).json({
      message: 'RSS test successful',
      totalArticles: articles.length,
      articles: articles.slice(0, 3), // Show first 3 for testing
    });
  } catch (error) {
    console.error('RSS test error:', error);
    res.status(500).json({
      message: 'RSS test failed',
      error: error.message,
    });
  }
});

// POST /api/rss/start - Start the cron job
router.post('/start', startCronJob);

// POST /api/rss/stop - Stop the cron job
router.post('/stop', stopCronJob);

export default router;
