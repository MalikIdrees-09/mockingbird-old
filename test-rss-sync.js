async function testRSSSync() {
  try {
    console.log('🧪 Testing RSS sync...\n');

    // Test 1: Check RSS status
    console.log('📊 Checking RSS sync status...');
    const statusResponse = await fetch('https://mockingbird-server-453975176199.asia-south1.run.app//api/rss/status');
    const statusData = await statusResponse.json();
    console.log('✅ Status:', JSON.stringify(statusData, null, 2));
    console.log('');

    // Test 2: Test RSS feed parsing
    console.log('🧪 Testing RSS feed parsing...');
    const testResponse = await fetch('https://mockingbird-server-453975176199.asia-south1.run.app//api/rss/test');
    const testData = await testResponse.json();
    console.log('✅ Test result:', JSON.stringify(testData, null, 2));
    console.log('');

    // Test 3: Manual sync
    console.log('🔄 Triggering manual RSS sync...');
    const syncResponse = await fetch('https://mockingbird-server-453975176199.asia-south1.run.app//api/rss/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const syncData = await syncResponse.json();
    console.log('✅ Sync result:', JSON.stringify(syncData, null, 2));
    console.log('');

    console.log('🎉 RSS sync test completed!');
    console.log('📋 Check your feed for new Al Jazeera posts!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 5000');
    console.log('💡 Try: npm run dev in the server directory');
  }
}

testRSSSync();
