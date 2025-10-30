import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { syncRSSFeed } from './utils/rssSync.js';

dotenv.config();

async function testRSSSync() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to database');
    console.log('🧪 Testing RSS sync functionality...');

    const result = await syncRSSFeed();
    console.log('📊 RSS Sync Result:');
    console.log('   Success:', result.success);
    console.log('   Articles Processed:', result.articlesProcessed);
    console.log('   Posts Created:', result.postsCreated);
    console.log('   Errors:', result.errors);

    if (result.error) {
      console.log('   Error:', result.error);
    }

    if (result.postsCreated > 0) {
      console.log('✅ RSS sync successful! Created', result.postsCreated, 'news posts');
    } else if (result.success) {
      console.log('✅ RSS sync completed successfully, no new articles to process');
    } else {
      console.log('❌ RSS sync failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

console.log('🧪 Starting RSS Sync Test...');
testRSSSync();
