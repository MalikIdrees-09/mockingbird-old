import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * Compress and resize images for optimal storage and performance
 * Similar to Facebook/Instagram image optimization
 */
export const processImage = async (inputPath, options = {}) => {
  try {
    const {
      maxWidth = 1200,      // Max width for posts
      maxHeight = 1200,     // Max height for posts
      quality = 80,         // JPEG quality (1-100)
      format = 'jpeg',      // Output format
      fit = 'inside'        // How to fit the image
    } = options;

    const parsedPath = path.parse(inputPath);
    const outputPath = path.join(parsedPath.dir, `${parsedPath.name}_optimized.${format}`);

    // Get image metadata to determine processing strategy
    const metadata = await sharp(inputPath).metadata();

    let resizeOptions = {};

    // Only resize if image is larger than our max dimensions
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      resizeOptions = {
        width: maxWidth,
        height: maxHeight,
        fit,
        withoutEnlargement: true // Don't enlarge smaller images
      };
    }

    // Process the image
    const processedImageBuffer = await sharp(inputPath)
      .resize(resizeOptions)
      .jpeg({ quality, progressive: true }) // Always convert to JPEG for consistency
      .toBuffer();

    // Write the processed image
    await fs.writeFile(outputPath, processedImageBuffer);

    // Get new file size
    const stats = await fs.stat(outputPath);
    const originalStats = await fs.stat(inputPath);

    console.log(`🖼️ Image optimized: ${originalStats.size} bytes → ${stats.size} bytes (${((stats.size / originalStats.size) * 100).toFixed(1)}% of original)`);

    return {
      originalPath: inputPath,
      processedPath: outputPath,
      originalSize: originalStats.size,
      processedSize: stats.size,
      compressionRatio: ((stats.size / originalStats.size) * 100).toFixed(1),
      dimensions: resizeOptions.width ? `${maxWidth}x${maxHeight}` : `${metadata.width}x${metadata.height}`
    };

  } catch (error) {
    console.error('❌ Error processing image:', error);
    // Return original path if processing fails
    return {
      originalPath: inputPath,
      processedPath: inputPath,
      error: error.message
    };
  }
};

/**
 * Process profile picture with specific dimensions
 */
export const processProfilePicture = async (inputPath) => {
  return processImage(inputPath, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 85,
    fit: 'cover' // Crop to square for profile pictures
  });
};

/**
 * Process post image with standard dimensions
 */
export const processPostImage = async (inputPath) => {
  return processImage(inputPath, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 80,
    fit: 'inside'
  });
};

/**
 * Process comment attachment image with smaller dimensions
 */
export const processCommentImage = async (inputPath) => {
  return processImage(inputPath, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 75,
    fit: 'inside'
  });
};

/**
 * Clean up temporary files after processing
 */
export const cleanupTempFiles = async (filePaths) => {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Cleaned up temp file: ${filePath}`);
    } catch (error) {
      console.warn(`⚠️ Could not clean up temp file: ${filePath}`, error.message);
    }
  }
};
