# RSS Sync Feature Documentation

## Overview
The RSS Sync feature automatically fetches news articles from Al Jazeera's RSS feed and creates posts in the Mockingbird platform every 10 minutes.

## Features
- ✅ **Automatic Sync**: Runs every 10 minutes via cron job
- ✅ **Rich Previews**: Automatic link preview generation with thumbnails
- ✅ **Deduplication**: Prevents duplicate posts using article URLs
- ✅ **Verified Source**: Posts from verified Al Jazeera account
- ✅ **Clean Content**: URLs removed from post text, only rich previews shown

## API Endpoints

### Get Sync Status
```bash
GET /api/rss/status
```
Returns current sync status, last sync time, and configuration.

### Manual Sync Trigger
```bash
POST /api/rss/sync
```
Manually triggers RSS sync (useful for testing).

### Test RSS Feed
```bash
GET /api/rss/test
```
Tests RSS feed parsing without creating posts (development only).

### Control Cron Job
```bash
POST /api/rss/start  # Start automatic sync
POST /api/rss/stop   # Stop automatic sync
```

## Configuration
The RSS sync is configured in `server/utils/rssSync.js`:

```javascript
export const RSS_CONFIG = {
  FEED_URL: 'https://www.aljazeera.com/xml/rss/all.xml',
  AL_JAZEERA_USER_ID: null, // Set automatically on startup
  MAX_ARTICLES_PER_SYNC: 5,  // Maximum articles to process per sync
  SYNC_INTERVAL_MINUTES: 10, // Cron interval
};
```

## How It Works

1. **Cron Job**: Runs every 10 minutes (`*/10 * * * *`)
2. **RSS Fetching**: Downloads Al Jazeera RSS feed
3. **Article Processing**: Extracts headlines, links, and descriptions
4. **Deduplication**: Checks against existing posts to avoid duplicates
5. **Post Creation**: Creates posts with headlines and link previews
6. **Rich Previews**: Automatically generates thumbnails and metadata

## Post Format
Each RSS article becomes a post with:
- **Author**: Al Jazeera (verified badge)
- **Content**: Article headline
- **Link Preview**: Rich card with thumbnail, title, and description
- **Timestamp**: Article publication date

## Testing
1. **Install Dependencies**: `npm install` in server directory
2. **Start Server**: `npm run dev`
3. **Check Status**: Visit `https://mockingbird-backend-453975176199.us-central1.run.app/api/rss/status`
4. **Test Feed**: Visit `https://mockingbird-backend-453975176199.us-central1.run.app/api/rss/test`
5. **Manual Sync**: `POST https://mockingbird-backend-453975176199.us-central1.run.app/api/rss/sync`

## Monitoring
The system provides comprehensive logging:
- ✅ Sync success/failure messages
- 📊 Articles processed count
- 🔍 Detailed error reporting
- ⏰ Next scheduled sync time

## Troubleshooting
- **No Articles**: Check RSS feed URL accessibility
- **User Not Found**: Ensure Al Jazeera user is created in database
- **Link Preview Issues**: Verify article URLs are accessible
- **Cron Not Running**: Check server logs for initialization errors

## Customization
To change the RSS source:
1. Update `RSS_CONFIG.FEED_URL` in `rssSync.js`
2. Update user creation in `data/index.js`
3. Modify logo in `public/assets/`

## Security
- ✅ Rate limiting via cron intervals
- ✅ Input validation on all endpoints
- ✅ Error handling for malformed RSS
- ✅ No external API keys required
