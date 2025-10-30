import { syncRSSFeed } from '../utils/rssSync.js';
import { forceRSSSync, getRSSSyncStatus, startRSSSync, stopRSSSync } from '../services/cronService.js';

export const rssSync = async (req, res) => {
  try {
    console.log(`🔄 RSS sync API called at ${new Date().toISOString()}`);

    const result = await syncRSSFeed();

    if (result.success) {
      res.status(200).json({
        message: 'RSS sync completed successfully',
        ...result,
      });
    } else {
      res.status(500).json({
        message: 'RSS sync failed',
        ...result,
      });
    }
  } catch (error) {
    console.error('RSS sync API error:', error);
    res.status(500).json({
      message: 'RSS sync failed due to server error',
      error: error.message,
    });
  }
};

export const forceSync = async (req, res) => {
  try {
    console.log(`🔄 Force RSS sync API called at ${new Date().toISOString()}`);

    const result = await forceRSSSync();

    if (result.success) {
      res.status(200).json({
        message: 'Force RSS sync completed successfully',
        ...result,
      });
    } else {
      res.status(500).json({
        message: 'Force RSS sync failed',
        ...result,
      });
    }
  } catch (error) {
    console.error('Force RSS sync API error:', error);
    res.status(500).json({
      message: 'Force RSS sync failed due to server error',
      error: error.message,
    });
  }
};

export const getSyncStatus = async (req, res) => {
  try {
    const status = getRSSSyncStatus();

    res.status(200).json({
      message: 'RSS sync status retrieved',
      ...status,
    });
  } catch (error) {
    console.error('Get RSS sync status error:', error);
    res.status(500).json({
      message: 'Failed to retrieve RSS sync status',
      error: error.message,
    });
  }
};

export const startCronJob = async (req, res) => {
  try {
    startRSSSync();

    res.status(200).json({
      message: 'RSS sync cron job started successfully',
      status: getRSSSyncStatus(),
    });
  } catch (error) {
    console.error('Start RSS sync cron error:', error);
    res.status(500).json({
      message: 'Failed to start RSS sync cron job',
      error: error.message,
    });
  }
};

export const stopCronJob = async (req, res) => {
  try {
    stopRSSSync();

    res.status(200).json({
      message: 'RSS sync cron job stopped successfully',
      status: getRSSSyncStatus(),
    });
  } catch (error) {
    console.error('Stop RSS sync cron error:', error);
    res.status(500).json({
      message: 'Failed to stop RSS sync cron job',
      error: error.message,
    });
  }
};
