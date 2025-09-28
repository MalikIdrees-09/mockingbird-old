import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const clearAdminFriends = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/mockingbird');

    console.log('Connected to database');

    // Find the admin user (by isAdmin field or by email)
    let adminUser = await User.findOne({ isAdmin: true });

    if (!adminUser) {
      console.log('Admin user not found by isAdmin field, trying by email...');
      // Try finding by email if isAdmin doesn't work
      adminUser = await User.findOne({ email: 'idrees@example.com' }); // Adjust email as needed
      if (!adminUser) {
        console.log('Admin user not found by email, trying by firstName...');
        adminUser = await User.findOne({ firstName: 'Malik' }); // Try different criteria
        if (!adminUser) {
          console.log('Admin user not found');
          return;
        }
      }
    }

    console.log('Found admin user:', adminUser.firstName, adminUser.lastName, 'ID:', adminUser._id);
    console.log('Current friends count:', adminUser.friends.length);
    console.log('Current friend requests:', adminUser.friendRequests.length);
    console.log('Current sent friend requests:', adminUser.sentFriendRequests.length);

    // Clear the friends array
    adminUser.friends = [];
    adminUser.friendRequests = [];
    adminUser.sentFriendRequests = [];

    await adminUser.save();

    console.log('Admin friends cleared successfully');

  } catch (error) {
    console.error('Error clearing admin friends:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
};

clearAdminFriends();
