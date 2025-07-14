#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');

// Letterboxd RSS configuration
const LETTERBOXD_CONFIG = {
  rssUrl: 'https://www.letterboxd.com/stevehnh/rss/',
  category: 'movie',
  tags: ['Movies', 'Review'],
  author: 'Stephen'
};

// Fetch RSS feed
function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        console.log(`Redirecting to: ${res.headers.location}`);
        fetchRSS(res.headers.location).then(resolve).catch(reject);
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Parse RSS and get latest review
function parseRSS(xmlData) {
  return new Promise((resolve, reject) => {
    const options = {
      explicitArray: false,
      mergeAttrs: true,
      ignoreAttrs: false,
      tagNameProcessors: [
        name => name.replace(/:/g, '_')
      ]
    };
    
    parseString(xmlData, options, (err, result) => {
      if (err) {
        console.error('XML Parse Error:', err);
        reject(err);
      } else {
        try {
          const items = result.rss.channel.item;
          const latest = Array.isArray(items) ? items[0] : items;
          
          console.log('Latest item keys:', Object.keys(latest));
          
          // Extract movie details from the RSS item
          const title = latest.title;
          const description = latest.description;
          const pubDate = latest.pubDate;
          const link = latest.link;
          
          // Extract film details from letterboxd namespace (now with underscore)
          const filmTitle = latest.letterboxd_filmTitle || '';
          const filmYear = latest.letterboxd_filmYear || '';
          const memberRating = latest.letterboxd_memberRating || '';
          const watchedDate = latest.letterboxd_watchedDate || '';
          
          // Extract poster image from description
          const posterMatch = description.match(/<img[^>]*src="([^"]*)"[^>]*>/);
          const posterUrl = posterMatch ? posterMatch[1] : '';
          
          // Extract review text (preserve paragraph breaks)
          const reviewText = description
            .replace(/<img[^>]*>/g, '') // Remove image tags
            .replace(/<\/p>/g, '\n\n') // Convert closing p tags to double newlines
            .replace(/<p[^>]*>/g, '') // Remove opening p tags
            .replace(/<br\s*\/?>/g, '\n') // Convert br tags to newlines
            .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
            .replace(/\n{3,}/g, '\n\n') // Limit multiple newlines to double
            .trim();
          
          // Generate star rating display
          const starRating = memberRating ? '★'.repeat(Math.floor(memberRating)) + (memberRating % 1 ? '½' : '') : '';
          
          resolve({
            title,
            filmTitle,
            filmYear,
            memberRating,
            starRating,
            reviewText,
            posterUrl,
            pubDate,
            watchedDate,
            link
          });
        } catch (parseErr) {
          console.error('Parse processing error:', parseErr);
          reject(parseErr);
        }
      }
    });
  });
}

// Generate Hugo frontmatter and content
function generatePost(review) {
  const date = new Date(review.pubDate).toISOString();
  const postTitle = `${review.filmTitle} (${review.filmYear})`;
  
  // Create filename (sanitize title)
  const filename = postTitle.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  const frontmatter = `---
title: "${postTitle}"
date: ${date}

categories: ["${LETTERBOXD_CONFIG.category}"]
tags: [${LETTERBOXD_CONFIG.tags.map(tag => `"${tag}"`).join(', ')}]
author: "${LETTERBOXD_CONFIG.author}"

# Movie specific metadata
movie:
  title: "${review.filmTitle}"
  year: ${review.filmYear}
  rating: ${review.memberRating}
  stars: "${review.starRating}"
  poster: "${review.posterUrl}"
  letterboxd_url: "${review.link}"
  watched_date: "${review.watchedDate}"

---

${review.posterUrl ? `![${review.filmTitle} Poster](${review.posterUrl})` : ''}

**Rating:** ${review.starRating} (${review.memberRating}/5)

${review.reviewText || 'No review text available.'}

---

*[View on Letterboxd](${review.link})*
`;

  return { filename: `${filename}.md`, content: frontmatter };
}

// Main function
async function main() {
  try {
    console.log('Fetching latest movie review from Letterboxd...');
    const rssData = await fetchRSS(LETTERBOXD_CONFIG.rssUrl);
    
    // Debug: Show first few characters of the response
    console.log('First 200 chars of RSS data:', rssData.substring(0, 200));
    console.log('Response length:', rssData.length);
    
    const review = await parseRSS(rssData);
    
    console.log(`Latest review: ${review.filmTitle} (${review.filmYear})`);
    console.log(`Rating: ${review.starRating} (${review.memberRating}/5)`);
    console.log(`Published: ${review.pubDate}`);
    console.log(`Watched: ${review.watchedDate}`);
    
    const post = generatePost(review);
    const outputPath = path.join(__dirname, '..', 'content', 'en', 'post', post.filename);
    
    // Check if file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`Post already exists: ${post.filename}`);
      process.exit(0);
    }
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, post.content);
    console.log(`Created: ${outputPath}`);
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Ensure script exits properly
process.on('beforeExit', (code) => {
  console.log('Process beforeExit event with code: ', code);
});

process.on('exit', (code) => {
  console.log('Process exit event with code: ', code);
});

main();