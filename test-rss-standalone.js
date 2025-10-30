import Parser from 'rss-parser';

const parser = new Parser();
async function testRSSStandalone() {
  try {
    console.log('🧪 Testing RSS functionality (standalone)...\n');

    // Test 1: Fetch RSS feed directly
    console.log('📡 Testing direct RSS feed fetch...');
    const feed = await parser.parseURL('https://www.aljazeera.com/xml/rss/all.xml');
    console.log(`✅ RSS feed fetched successfully!`);
    console.log(`📄 Feed title: ${feed.title}`);
    console.log(`📰 Articles found: ${feed.items?.length || 0}\n`);

    // Test 2: Extract sample articles
    console.log('📝 Testing article extraction...');
    const articles = feed.items.slice(0, 3).map(item => ({
      title: item.title,
      link: item.link,
      description: item.contentSnippet || item.summary,
      pubDate: item.pubDate,
      guid: item.guid || item.link,
      image: item.enclosure?.url || item['media:content']?.$?.url || item['media:thumbnail']?.$?.url,
    })).filter(item => item.title && item.link);

    console.log(`✅ Extracted ${articles.length} articles:`);
    articles.forEach((article, index) => {
      console.log(`\n  ${index + 1}. ${article.title}`);
      console.log(`     🔗 ${article.link}`);
      console.log(`     📅 ${article.pubDate}`);
      if (article.image) {
        console.log(`     🖼️ Image: ${article.image}`);
      }
    });

    console.log('\n🎉 RSS parsing test completed!');
    console.log('\n📋 Sample post that would be created:');
    console.log(`📝 "${articles[0]?.title || 'No title'}"`);
    console.log(`🔗 Link preview for: ${articles[0]?.link || 'No link'}`);
    console.log(`👤 Posted by: Al Jazeera (verified)`);

    console.log('\n💡 To test with server:');
    console.log('1. Kill existing server processes');
    console.log('2. Start server: npm run dev');
    console.log('3. Check status: curl https://mockingbird-backend-453975176199.us-central1.run.app/api/rss/status');
    console.log('4. Manual sync: curl -X POST https://mockingbird-backend-453975176199.us-central1.run.app/api/rss/sync');
    console.log('5. View posts in the feed!');

  } catch (error) {
    console.error('❌ RSS test failed:', error.message);
  }
}

testRSSStandalone();
