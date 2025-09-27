import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProfanityFilter {
  constructor() {
    this.profanityWords = new Set();
    this.loadProfanityWords();
  }

  loadProfanityWords() {
    try {
      const filePath = path.join(__dirname, 'profanityWords.txt');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse the file and extract words (ignore comments and empty lines)
      const words = fileContent
        .split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(line => line && !line.startsWith('#'));
      
      this.profanityWords = new Set(words);
      console.log(`📚 Loaded ${this.profanityWords.size} profanity words for filtering`);
    } catch (error) {
      console.warn('⚠️ Could not load profanity words file:', error.message);
      console.log('📝 Using empty profanity filter - add words to profanityWords.txt');
    }
  }

  // Check if text contains profanity
  containsProfanity(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const cleanText = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    const words = cleanText.split(' ');
    
    // Check each word against profanity list
    for (const word of words) {
      if (this.profanityWords.has(word)) {
        console.log(`🚫 WATCH YOUR MOUTH! Profanity detected: "${word}" in text: "${text.substring(0, 50)}..."`);
        return true;
      }
    }

    // Check for words that might be disguised with numbers/symbols
    const alphanumericText = cleanText.replace(/[0-9@$!]/g, match => {
      const replacements = {
        '0': 'o',
        '1': 'i',
        '3': 'e',
        '4': 'a',
        '5': 's',
        '7': 't',
        '8': 'b',
        '@': 'a',
        '$': 's',
        '!': 'i'
      };
      return replacements[match] || match;
    });

    const disguisedWords = alphanumericText.split(' ');
    for (const word of disguisedWords) {
      if (this.profanityWords.has(word)) {
        console.log(`🚫 WATCH YOUR MOUTH! Disguised profanity detected: "${word}" in text: "${text.substring(0, 50)}..."`);
        return true;
      }
    }

    return false;
  }

  // Get profanity words found in text (for logging/reporting)
  getProfanityWords(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const cleanText = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = cleanText.split(' ');
    const foundProfanity = [];
    
    for (const word of words) {
      if (this.profanityWords.has(word)) {
        foundProfanity.push(word);
      }
    }

    return foundProfanity;
  }

  // Add new profanity word (for dynamic updates)
  addProfanityWord(word) {
    if (word && typeof word === 'string') {
      this.profanityWords.add(word.toLowerCase().trim());
      console.log(`➕ Added profanity word: "${word}"`);
    }
  }

  // Remove profanity word (for dynamic updates)
  removeProfanityWord(word) {
    if (word && typeof word === 'string') {
      this.profanityWords.delete(word.toLowerCase().trim());
      console.log(`➖ Removed profanity word: "${word}"`);
    }
  }

  // Get statistics
  getStats() {
    return {
      totalWords: this.profanityWords.size,
      isActive: this.profanityWords.size > 0
    };
  }
}

// Create singleton instance
const profanityFilter = new ProfanityFilter();

export default profanityFilter;
