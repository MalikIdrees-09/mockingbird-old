import axios from 'axios';
import * as cheerio from 'cheerio';

export const extractLinkMetadata = async (url) => {
  try {
    console.log(`🔗 Extracting metadata for: ${url}`);

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Mockingbird-Link-Preview/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects and client errors but not server errors
      },
    });

    console.log(`✅ Successfully fetched page: ${url} (${response.status})`);

    const $ = cheerio.load(response.data);

    // Extract Open Graph data (preferred)
    const getMeta = (property) => {
      return $(`meta[property="${property}"]`).attr('content') ||
             $(`meta[name="${property}"]`).attr('content') ||
             $(`meta[property="og:${property}"]`).attr('content');
    };

    // Extract title
    const title = getMeta('og:title') ||
                 $('title').text() ||
                 getMeta('twitter:title') ||
                 'No title available';

    // Extract description
    const description = getMeta('og:description') ||
                       getMeta('description') ||
                       getMeta('twitter:description') ||
                       $('meta[name="description"]').attr('content') ||
                       '';

    // Extract image - Enhanced for news sites
    let image = '';

    // Try multiple image sources in order of preference
    const imageSources = [
      // Open Graph images (most reliable)
      'og:image',
      'og:image:url',
      'og:image:secure_url',
      'og:image:width', // Sometimes the actual image URL is in width property

      // Twitter Card images
      'twitter:image',
      'twitter:image:src',

      // Article images
      'article:image',

      // Generic meta images
      'image',
      'thumbnail',

      // Pinterest
      'pinterest-rich-pin',

      // Fallback to any meta tag with image in name
      ...Array.from($('meta')).map(meta => $(meta).attr('property') || $(meta).attr('name')).filter(attr => attr && attr.toLowerCase().includes('image'))
    ];

    for (const source of imageSources) {
      const imgUrl = getMeta(source);
      if (imgUrl && imgUrl.trim()) {
        image = imgUrl.trim();
        console.log(`📸 Found image using ${source}: ${image}`);
        break;
      }
    }

    // Fallback: Look for images in structured data or article content
    if (!image) {
      // Check JSON-LD structured data
      const jsonLdScript = $('script[type="application/ld+json"]').html();
      if (jsonLdScript) {
        try {
          const jsonLd = JSON.parse(jsonLdScript);
          if (jsonLd.image) {
            image = Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image;
            console.log(`📸 Found image in JSON-LD: ${image}`);
          }
        } catch (e) {
          // JSON parse failed, continue
        }
      }
    }

    // Last resort: Look for first article image or any large image
    if (!image) {
      const articleImage = $('article img').first().attr('src') ||
                          $('.article-content img').first().attr('src') ||
                          $('.content img').first().attr('src') ||
                          $('img[alt*="article"], img[alt*="news"]').first().attr('src');

      if (articleImage) {
        image = articleImage;
        console.log(`📸 Found fallback article image: ${image}`);
      }
    }

    // Extract site name
    const siteName = getMeta('og:site_name') ||
                    getMeta('twitter:site') ||
                    new URL(url).hostname.replace('www.', '');

    // Extract favicon
    const favicon = $('link[rel="icon"]').attr('href') ||
                   $('link[rel="shortcut icon"]').attr('href') ||
                   $('link[rel="apple-touch-icon"]').attr('href') ||
                   '/favicon.ico';

    // Clean up data
    const cleanText = (text) => {
      return text
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 300);
    };

    const cleanUrl = (imageUrl) => {
      if (!imageUrl || typeof imageUrl !== 'string') return '';

      let cleanedUrl = imageUrl.trim();

      // Handle protocol-relative URLs
      if (cleanedUrl.startsWith('//')) {
        return `https:${cleanedUrl}`;
      }

      // Handle relative URLs
      if (cleanedUrl.startsWith('/')) {
        try {
          const urlObj = new URL(url);
          return `${urlObj.origin}${cleanedUrl}`;
        } catch {
          return cleanedUrl;
        }
      }

      // Handle URLs that start with ./
      if (cleanedUrl.startsWith('./')) {
        try {
          const urlObj = new URL(url);
          return `${urlObj.origin}/${cleanedUrl.substring(2)}`;
        } catch {
          return cleanedUrl;
        }
      }

      // Handle URLs that start with ../
      if (cleanedUrl.startsWith('../')) {
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/').filter(p => p);
          const levelsUp = (cleanedUrl.match(/\.\.\//g) || []).length;

          // Go up the specified number of levels
          for (let i = 0; i < levelsUp && pathParts.length > 0; i++) {
            pathParts.pop();
          }

          const newPath = pathParts.join('/');
          const basePath = newPath ? `/${newPath}` : '';
          return `${urlObj.origin}${basePath}/${cleanedUrl.replace(/\.\.\//g, '')}`;
        } catch {
          return cleanedUrl;
        }
      }

      // Handle URLs without protocol (assume https)
      if (cleanedUrl.match(/^[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}/)) {
        return `https://${cleanedUrl}`;
      }

      // Validate URL format
      try {
        new URL(cleanedUrl);
        return cleanedUrl;
      } catch {
        // If URL is invalid, try to prepend https
        if (!cleanedUrl.startsWith('http')) {
          try {
            new URL(`https://${cleanedUrl}`);
            return `https://${cleanedUrl}`;
          } catch {
            return '';
          }
        }
        return '';
      }
    };

    // Clean and validate the image URL
    const cleanedImage = cleanUrl(image);

    console.log(`🔗 Processing image for ${url}:`);
    console.log(`📷 Raw image URL: ${image}`);
    console.log(`🧹 Cleaned image URL: ${cleanedImage}`);

    // Additional validation for image URLs
    const isValidImageUrl = (imgUrl) => {
      if (!imgUrl) return false;

      try {
        const urlObj = new URL(imgUrl);
        // Check if URL has valid image extension or contains image-like path
        const pathname = urlObj.pathname.toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
        const hasValidExtension = validExtensions.some(ext => pathname.includes(ext));

        // Check for common image path patterns (expanded)
        const imagePathPatterns = [
          '/image', '/img', '/photo', '/picture', '/thumbnail', '/thumb',
          '/article', '/story', '/news', '/content', '/media', '/assets',
          'upload', 'cdn', 'media', 'images', 'photos', 'pictures',
          'article', 'story', 'news', 'content'
        ];
        const hasImagePath = imagePathPatterns.some(pattern => pathname.includes(pattern));

        // More lenient validation - accept if it has extension OR image-like path OR contains image-related terms
        const isLikelyImage = hasValidExtension || hasImagePath ||
                            pathname.includes('image') ||
                            pathname.includes('photo') ||
                            pathname.includes('picture') ||
                            pathname.includes('thumb') ||
                            pathname.includes('media');

        // If validation fails but URL looks reasonable, accept it anyway (fallback for edge cases)
        const fallbackValidation = !isLikelyImage && imgUrl.length > 10 && !pathname.includes('.html') && !pathname.includes('.php') && !pathname.includes('.htm');

        // Ultra-lenient fallback: accept any URL that doesn't look like HTML/PHP and is longer than 10 chars
        const ultraFallback = !fallbackValidation && imgUrl.length > 10 &&
                            !imgUrl.toLowerCase().includes('javascript:') &&
                            !imgUrl.toLowerCase().includes('data:') &&
                            !imgUrl.toLowerCase().includes('<script');

        console.log(`🔍 Image validation for ${imgUrl}:`, {
          pathname,
          hasValidExtension,
          hasImagePath,
          isLikelyImage,
          fallbackValidation,
          ultraFallback,
          finalResult: isLikelyImage || fallbackValidation || ultraFallback
        });

        return isLikelyImage || fallbackValidation || ultraFallback;
      } catch {
        console.log(`❌ Invalid URL format: ${imgUrl}`);
        return false;
      }
    };

    const metadata = {
      url,
      title: cleanText(title),
      description: cleanText(description),
      siteName: cleanText(siteName),
      favicon: cleanUrl(favicon),
    };

    // Only add image if validation passes
    if (isValidImageUrl(cleanedImage)) {
      metadata.image = cleanedImage;
    }

    // Log image extraction results
    if (image) {
      console.log(`📸 Image extracted: ${metadata.image || 'NONE'}`);
    } else {
      console.log(`⚠️ No image found for: ${url}`);
    }

    console.log(`✅ Successfully extracted metadata for: ${url}`);
    return metadata;

  } catch (error) {
    console.error(`❌ Failed to extract metadata for ${url}:`, error.message);
    return null;
  }
};

export const extractUrlsFromText = (text) => {
  if (!text) return [];

  console.log(`🔍 extractUrlsFromText called with: "${text}"`);

  // Enhanced URL regex that handles various URL formats
  const urlRegex = /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))/gi;

  const urls = text.match(urlRegex) || [];
  console.log(`📋 Raw URLs found:`, urls);

  // Clean and deduplicate URLs
  const cleanUrls = urls.map(url => {
    // Remove trailing punctuation
    return url.replace(/[.,;!?]+$/, '');
  });

  const uniqueUrls = [...new Set(cleanUrls)].slice(0, 3); // Limit to 3 URLs per post
  console.log(`✨ Final unique URLs:`, uniqueUrls);

  return uniqueUrls;
};

export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
