import Parser from 'rss-parser';
import axios from 'axios';

const parser = new Parser();

async function testRSS() {
  try {
    console.log('🧪 Testing RSS functionality...\n');

    // Test 1: Fetch RSS feed
    console.log('📡 Testing RSS feed fetch...');
    const feed = await parser.parseURL('https://www.aljazeera.com/xml/rss/all.xml');
    console.log(`✅ RSS feed fetched successfully!`);
    console.log(`📄 Feed title: ${feed.title}`);
    console.log(`📰 Articles found: ${feed.items?.length || 0}\n`);

    // Test 2: Extract articles
    console.log('📝 Testing article extraction...');
    const articles = feed.items.slice(0, 3).map(item => ({
      title: item.title,
      link: item.link,
      description: item.contentSnippet || item.summary,
      pubDate: item.pubDate,
    }));

    console.log(`✅ Extracted ${articles.length} articles:`);
    articles.forEach((article, index) => {
      console.log(`  ${index + 1}. ${article.title}`);
      console.log(`     🔗 ${article.link}`);
      console.log(`     📅 ${article.pubDate}\n`);
    });

    // Test 3: Link preview extraction
    console.log('🖼️ Testing link preview extraction...');
    for (const article of articles.slice(0, 1)) {
      try {
        console.log(`🔍 Extracting preview for: ${article.link}`);
        const response = await axios.get(`https://mockingbird-server-453975176199.asia-south1.run.app//posts/link-preview`, {
          data: { url: article.link }
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log(`✅ Link preview extracted!`);
        console.log(`📱 Title: ${response.data.title || 'No title'}`);
        console.log(`🖼️ Image: ${response.data.image ? 'Found' : 'Not found'}`);
      } catch (error) {
        console.log(`⚠️ Link preview extraction failed:`, error.message);
      }
    }

    console.log('\n🎉 RSS system test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Check RSS status: curl https://mockingbird-server-453975176199.asia-south1.run.app//api/rss/status');
    console.log('3. Test RSS sync: curl -X POST https://mockingbird-server-453975176199.asia-south1.run.app//api/rss/sync');
    console.log('4. View news posts in the feed!');

  } catch (error) {
    console.error('❌ RSS test failed:', error.message);
  }
}

testRSS();
