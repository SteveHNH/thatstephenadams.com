#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');

// Podcast configuration
const PODCASTS = {
  'thosewerethedays': {
    showId: '63e2726119b0f400109d2166',
    rssUrl: 'https://feeds.acast.com/public/shows/thosewerethedays',
    category: 'podcast',
    tags: ['Those Were the Days'],
    titlePrefix: 'TWTD - '
  },
  '24-fps-presents': {
    showId: '67f1bf0e506c6c628c80f97f',
    rssUrl: 'https://feeds.acast.com/public/shows/24-fps-presents',
    category: 'podcast',
    tags: ['24fps'],
    titlePrefix: ''
  }
};

// Fetch RSS feed
function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Parse RSS and get latest episode
function parseRSS(xmlData) {
  return new Promise((resolve, reject) => {
    parseString(xmlData, (err, result) => {
      if (err) reject(err);
      else {
        const items = result.rss.channel[0].item;
        const latest = items[0]; // First item is most recent
        resolve({
          title: latest.title[0],
          pubDate: latest.pubDate[0],
          guid: latest.guid[0]._
        });
      }
    });
  });
}

// Generate Hugo frontmatter and content
function generatePost(podcastKey, episode) {
  const config = PODCASTS[podcastKey];
  const date = new Date(episode.pubDate).toISOString();
  const title = `${config.titlePrefix}${episode.title}`;
  
  // Create filename (sanitize title)
  const filename = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  const frontmatter = `---
title: "${title}"
date: ${date}

categories: ["${config.category}"]
tags: [${config.tags.map(tag => `"${tag}"`).join(', ')}]
author: "Stephen"

---

<iframe src="https://embed.acast.com/$/\${config.showId}/\${episode.guid}?" frameBorder="0" width="100%" height="110px" allow="autoplay"></iframe>
`;

  return { filename: `${filename}.md`, content: frontmatter };
}

// Main function
async function main() {
  const podcastKey = process.argv[2];
  
  if (!podcastKey || !PODCASTS[podcastKey]) {
    console.log('Usage: node podcast-automation.js <podcast-key>');
    console.log('Available podcasts:', Object.keys(PODCASTS).join(', '));
    return;
  }
  
  try {
    console.log(`Fetching latest episode for ${podcastKey}...`);
    const rssData = await fetchRSS(PODCASTS[podcastKey].rssUrl);
    const episode = await parseRSS(rssData);
    
    console.log(`Latest episode: ${episode.title}`);
    console.log(`Published: ${episode.pubDate}`);
    console.log(`GUID: ${episode.guid}`);
    
    const post = generatePost(podcastKey, episode);
    const outputPath = path.join(__dirname, '..', 'content', 'audio', post.filename);
    
    // Check if file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`Post already exists: ${post.filename}`);
      return;
    }
    
    fs.writeFileSync(outputPath, post.content);
    console.log(`Created: ${outputPath}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();