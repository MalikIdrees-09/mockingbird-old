import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { initializeAlJazeeraUser } from './scripts/initAdmin.js';
import { setAlJazeeraUserId } from './utils/rssSync.js';

dotenv.config();

async function initializeAlJazeera() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to database');
    console.log('📰 Initializing Al Jazeera user...');

    const alJazeeraUser = await initializeAlJazeeraUser();

    if (alJazeeraUser) {
      setAlJazeeraUserId(alJazeeraUser._id);
      console.log(`✅ Al Jazeera user initialized: ${alJazeeraUser._id}`);
      console.log(`📧 Email: ${alJazeeraUser.email}`);
      console.log(`👤 Name: ${alJazeeraUser.firstName} ${alJazeeraUser.lastName}`);
    } else {
      console.log('❌ Failed to initialize Al Jazeera user');
    }

  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

initializeAlJazeera();
