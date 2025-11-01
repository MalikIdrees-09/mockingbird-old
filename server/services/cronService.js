import cron from 'node-cron';
import { syncRSSFeed, RSS_CONFIG, syncRSSFeedForSource } from '../utils/rssSync.js';
import User from '../models/User.js';

let cronJob = null; // Al Jazeera default
let bbcCron = null;
let nasaCron = null;
let alifCron = null;
let lastSyncResult = null;

export const startRSSSync = async () => {
  if (cronJob) {
    console.log('RSS sync already running');
    return;
  }

  console.log(`Starting RSS sync cron job (every ${RSS_CONFIG.SYNC_INTERVAL_MINUTES} minutes)`);

  // Run every 30 minutes by default (configurable via RSS_CONFIG)
  cronJob = cron.schedule(`*/${RSS_CONFIG.SYNC_INTERVAL_MINUTES} * * * *`, async () => {
    console.log(`RSS sync triggered at ${new Date().toISOString()}`);

    try {
      const result = await syncRSSFeed();
      lastSyncResult = {
        timestamp: new Date(),
        ...result,
      };

      if (result.success) {
        console.log(`RSS sync successful: ${result.postsCreated} posts created`);
      } else {
        console.error(`RSS sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`RSS sync error:`, error.message);
      lastSyncResult = {
        timestamp: new Date(),
        success: false,
        error: error.message,
      };
    }
  });

  console.log(`RSS sync cron job started successfully`);

  // Start BBC cron (e.g., every 15 minutes)
  try {
    const bbcUser = await User.findOne({ email: 'news@bbc.com' });
    if (bbcUser && !bbcCron) {
      const interval = 15; // minutes
      console.log(`Starting BBC RSS sync cron job (every ${interval} minutes)`);
      bbcCron = cron.schedule(`*/${interval} * * * *`, async () => {
        console.log(`BBC RSS sync triggered at ${new Date().toISOString()}`);
        await syncRSSFeedForSource({
          name: 'BBC',
          feedUrl: 'https://feeds.bbci.co.uk/news/rss.xml',
          userId: bbcUser._id,
          maxArticlesPerSync: 1,
        });
      });
      console.log(`BBC RSS sync cron job started successfully`);
    }
  } catch (e) {
    console.error('Failed to start BBC cron:', e.message);
  }

  // Start NASA cron (every 12 minutes)
  try {
    const nasaUser = await User.findOne({ email: 'news@nasa.gov' });
    if (nasaUser && !nasaCron) {
      const interval = 12; // minutes
      console.log(`Starting NASA RSS sync cron job (every ${interval} minutes)`);
      nasaCron = cron.schedule(`*/${interval} * * * *`, async () => {
        console.log(`NASA RSS sync triggered at ${new Date().toISOString()}`);
        await syncRSSFeedForSource({
          name: 'NASA',
          feedUrl: 'https://www.nasa.gov/feed/',
          userId: nasaUser._id,
          maxArticlesPerSync: 1,
        });
      });
      console.log(`NASA RSS sync cron job started successfully`);
    }
  } catch (e) {
    console.error('Failed to start NASA cron:', e.message);
  }

  // Start Alif Global School cron (every 14 minutes, no dedup)
  try {
    const alifUser = await User.findOne({ email: 'alif@alifglobalschool.com' });
    if (alifUser && !alifCron) {
      const interval = 14; // minutes
      console.log(`Starting Alif Global School RSS sync cron job (every ${interval} minutes)`);
      alifCron = cron.schedule(`*/${interval} * * * *`, async () => {
        console.log(`Alif Global School RSS sync triggered at ${new Date().toISOString()}`);
        await syncRSSFeedForSource({
          name: 'Alif Global School',
          feedUrl: 'https://rss.app/feeds/loPMM4zwicvGnKbJ.xml',
          userId: alifUser._id,
          maxArticlesPerSync: 1,
        });
      });
      console.log(`Alif Global School RSS sync cron job started successfully`);
    }
  } catch (e) {
    console.error('Failed to start Alif Global School cron:', e.message);
  }
};

export const stopRSSSync = () => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log(`RSS sync cron job stopped`);
  }
  if (bbcCron) { bbcCron.stop(); bbcCron = null; console.log('BBC RSS sync cron job stopped'); }
  if (nasaCron) { nasaCron.stop(); nasaCron = null; console.log('NASA RSS sync cron job stopped'); }
  if (alifCron) { alifCron.stop(); alifCron = null; console.log('Alif Global School RSS sync cron job stopped'); }
};

export const forceRSSSync = async () => {
  console.log(`Manual RSS sync triggered at ${new Date().toISOString()}`);

  try {
    const result = await syncRSSFeed();
    lastSyncResult = {
      timestamp: new Date(),
      ...result,
    };
    return result;
  } catch (error) {
    console.error(`Manual RSS sync failed:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getRSSSyncStatus = () => {
  return {
    isRunning: cronJob !== null,
    lastSync: lastSyncResult,
    nextSync: cronJob ? cronJob.nextDate().toISOString() : null,
    config: {
      feedUrl: RSS_CONFIG.FEED_URL,
      intervalMinutes: RSS_CONFIG.SYNC_INTERVAL_MINUTES,
      maxArticles: RSS_CONFIG.MAX_ARTICLES_PER_SYNC,
    },
    bbcRunning: !!bbcCron,
    nasaRunning: !!nasaCron,
    alifRunning: !!alifCron,
  };
};
