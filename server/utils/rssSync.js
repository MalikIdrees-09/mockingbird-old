import Parser from 'rss-parser';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { extractLinkMetadata } from './linkPreview.js';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['description', 'description']
    ]
  }
});

// Backwards-compat default config kept for Al Jazeera usage
export const RSS_CONFIG = {
  FEED_URL: 'https://www.aljazeera.com/xml/rss/all.xml',
  AL_JAZEERA_USER_ID: null,
  MAX_ARTICLES_PER_SYNC: 1,
  SYNC_INTERVAL_MINUTES: 10,
};

export const setAlJazeeraUserId = (userId) => {
  RSS_CONFIG.AL_JAZEERA_USER_ID = userId;
};

export const fetchRSSFeed = async (feedUrl = RSS_CONFIG.FEED_URL) => {
  try {
    console.log(`📰 Fetching RSS feed from: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);

    console.log(`✅ RSS feed fetched successfully. Found ${feed.items?.length || 0} items`);
    return feed;
  } catch (error) {
    console.error(`❌ Failed to fetch RSS feed:`, error.message);
    throw error;
  }
};

export const extractNewsItems = (feed) => {
  if (!feed.items) return [];

  return feed.items.map(item => ({
    title: item.title,
    link: item.link,
    description: item.contentSnippet || item.summary || item.description,
    pubDate: item.pubDate,
    guid: item.guid || item.link, // Use GUID or link as unique identifier
    image: item.enclosure?.url || item['media:content']?.$?.url || item['media:thumbnail']?.$?.url,
  })).filter(item => item.title && item.link); // Only items with title and link
};

export const getProcessedArticles = async () => {
  // Collect URLs from linkPreviews across ALL posts to avoid duplicates across sources
  const posts = await Post.find({ linkPreviews: { $exists: true, $ne: [] } }).select('linkPreviews');
  const urls = [];
  for (const post of posts) {
    for (const preview of (post.linkPreviews || [])) {
      if (preview && preview.url) urls.push(preview.url);
    }
  }
  return Array.from(new Set(urls));
};

export const createNewsPost = async (article, { userEmail, userId, userPicturePath, rssSource } = {}) => {
  try {
    console.log(`📝 Creating news post: "${article.title}"`);

    // Resolve source user
    let sourceUser;
    if (userId) {
      sourceUser = await User.findById(userId);
    }
    if (!sourceUser && userEmail) {
      sourceUser = await User.findOne({ email: userEmail });
    }
    if (!sourceUser && RSS_CONFIG.AL_JAZEERA_USER_ID) {
      // Back-compat path for Al Jazeera only
      sourceUser = await User.findById(RSS_CONFIG.AL_JAZEERA_USER_ID);
    }
    if (!sourceUser) {
      throw new Error('RSS source user not found');
    }

    // Create post description with headline and link
    const description = `${article.title}\n\nRead the full article: ${article.link}`;

    const resolvedUserPicturePath = userPicturePath || sourceUser.picturePath || "";
    const normalizedRssSource = rssSource || sourceUser?.rssSource || sourceUser?.firstName || null;
    const rssGuid = (article.guid || article.link || "").trim() || null;
    const rssLink = (article.link || "").trim() || null;

    const postData = {
      userId: sourceUser._id.toString(),
      firstName: sourceUser.firstName,
      lastName: sourceUser.lastName,
      location: sourceUser.location,
      description: description,
      picturePath: "",
      userPicturePath: resolvedUserPicturePath,
      likes: new Map(),
      reactions: new Map(),
      comments: [],
      linkPreviews: [],
      rssSource: normalizedRssSource,
      rssGuid,
      rssLink,
    };

    // Extract link preview for the article URL
    try {
      console.log(`🔗 Extracting link preview for: ${article.link}`);
      const metadata = await extractLinkMetadata(article.link);

      if (metadata) {
        postData.linkPreviews.push({
          url: article.link,
          title: metadata.title || article.title,
          description: metadata.description || article.description,
          image: metadata.image,
          siteName: metadata.siteName || 'Al Jazeera',
          favicon: metadata.favicon,
        });
        console.log(`✅ Link preview extracted for article`);
      }
    } catch (error) {
      console.log(`⚠️ Failed to extract link preview, continuing without: ${error.message}`);
    }

    // Remove the article URL from description since we have the preview
    if (postData.linkPreviews.length > 0) {
      let cleanDescription = description;
      const urls = [article.link];
      urls.forEach(url => {
        const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cleanDescription = cleanDescription.replace(new RegExp(escapedUrl, 'g'), '').trim();
      });

      // Clean up extra spaces and formatting
      cleanDescription = cleanDescription
        .replace(/\n\n+/g, '\n\n')
        .replace(/^Read the full article:?\s*/gm, '')
        .trim();

      postData.description = cleanDescription || article.title;
    }

    const newPost = new Post(postData);
    await newPost.save();

    console.log(`✅ News post created successfully: ${newPost._id}`);
    return newPost;

  } catch (error) {
    console.error(`❌ Failed to create news post:`, error.message);
    throw error;
  }
};

// Generic sync for a given source
export const syncRSSFeedForSource = async ({
  name,
  feedUrl,
  userEmail,
  userId,
  maxArticlesPerSync = 1,
  disableDedup = false,
} = {}) => {
  try {
    console.log(`🚀 Starting RSS sync for ${name || 'source'} at ${new Date().toISOString()}`);

    const normalizedSourceName = name || 'source';
    const isNASAFeed = normalizedSourceName.toLowerCase() === 'nasa';
    const dedupeEnabled = !disableDedup;

    // Fetch RSS feed with retry logic
    let feed;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        feed = await fetchRSSFeed(feedUrl);
        break;
      } catch (error) {
        retryCount++;
        console.log(`⚠️ RSS fetch attempt ${retryCount} failed:`, error.message);

        if (retryCount >= maxRetries) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Extract news items
    const articles = extractNewsItems(feed);

    if (articles.length === 0) {
      console.log(`⚠️ No articles found in RSS feed`);
      return { success: true, articlesProcessed: 0, postsCreated: 0 };
    }

    // Get already processed articles to avoid duplicates
    let processedUrls = [];
    let processedUrlSet = new Set();

    if (dedupeEnabled) {
      processedUrls = await getProcessedArticles();
      console.log(`📋 Found ${processedUrls.length} already processed articles`);
      processedUrlSet = new Set(processedUrls.map(url => url.trim()));
    } else {
      console.log(`🚫 Deduplication disabled for ${normalizedSourceName}`);
    }

    let existingGuidSet = new Set();
    let existingLinkSet = new Set();

    if (dedupeEnabled && isNASAFeed && userId) {
      const nasaExistingPosts = await Post.find({ userId: String(userId) })
        .select('rssGuid rssLink')
        .lean();

      existingGuidSet = new Set(
        nasaExistingPosts
          .map(post => post.rssGuid?.trim())
          .filter(Boolean)
      );

      existingLinkSet = new Set(
        nasaExistingPosts
          .map(post => post.rssLink?.trim())
          .filter(Boolean)
      );

      console.log(`🛰️ NASA dedupe: cached ${existingGuidSet.size} GUIDs and ${existingLinkSet.size} links`);
    }

    // Filter out already processed articles
    const newArticles = (dedupeEnabled
      ? articles.filter(article => {
          const link = (article.link || '').trim();
          if (link && processedUrlSet.has(link)) {
            return false;
          }

          if (isNASAFeed) {
            const guid = (article.guid || '').trim();

            if ((guid && existingGuidSet.has(guid)) || (link && existingLinkSet.has(link))) {
              console.log(`🛰️ NASA dedupe: skipping duplicate article ${article.title}`);
              return false;
            }
          }

          return true;
        })
      : articles
    ).slice(0, maxArticlesPerSync);

    console.log(`🆕 Found ${newArticles.length} new articles to process`);

    // Create posts for new articles
    let postsCreated = 0;
    let errors = 0;

    for (const article of newArticles) {
      try {
        await createNewsPost(article, { userEmail, userId, rssSource: normalizedSourceName });
        if (isNASAFeed) {
          const guid = (article.guid || '').trim();
          const link = (article.link || '').trim();
          if (guid) existingGuidSet.add(guid);
          if (link) existingLinkSet.add(link);
        }
        postsCreated++;
      } catch (error) {
        console.error(`❌ Failed to create post for article "${article.title}":`, error.message);
        errors++;
      }
    }

    console.log(`🎉 RSS sync completed: ${postsCreated} new posts created, ${errors} errors`);
    return {
      success: true,
      articlesProcessed: newArticles.length,
      postsCreated,
      errors,
      totalArticles: articles.length,
      processedArticles: dedupeEnabled ? processedUrls.length : 0,
    };

  } catch (error) {
    console.error(`❌ RSS sync failed:`, error.message);
    return {
      success: false,
      error: error.message,
      articlesProcessed: 0,
      postsCreated: 0,
    };
  }
};

// Backwards compatibility: maintain original function for Al Jazeera
export const syncRSSFeed = async () =>
  syncRSSFeedForSource({
    name: 'Al Jazeera',
    feedUrl: RSS_CONFIG.FEED_URL,
    userId: RSS_CONFIG.AL_JAZEERA_USER_ID,
    maxArticlesPerSync: RSS_CONFIG.MAX_ARTICLES_PER_SYNC || 1,
  });
