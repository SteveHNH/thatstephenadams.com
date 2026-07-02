#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const TMDB_API_KEY = process.env.TMDB_API_KEY || '8e4504c72684ee6190ae073ce5c07797';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const LETTERBOXD_USER = 'stevehnh';

function tmdbGet(endpoint) {
  return new Promise((resolve, reject) => {
    const sep = endpoint.includes('?') ? '&' : '?';
    const url = `https://api.themoviedb.org/3${endpoint}${sep}api_key=${TMDB_API_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function promptMultiline(rl, header) {
  console.log(header);
  console.log('(type . on its own line to finish)\n');
  const lines = [];
  return new Promise(resolve => {
    const handler = (line) => {
      if (line.trim() === '.') {
        rl.removeListener('line', handler);
        resolve(lines.join('\n').trim());
      } else {
        lines.push(line);
      }
    };
    rl.on('line', handler);
  });
}

function toStars(rating) {
  return '★'.repeat(Math.floor(rating)) + (rating % 1 ? '½' : '');
}

function toSlug(title) {
  return title.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatRating(rating) {
  return Number.isInteger(rating) ? rating.toFixed(1) : String(rating);
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log('\n🎬 Movie Review Creator\n');

    // Search TMDB
    const searchTitle = await prompt(rl, 'Movie title: ');
    process.stdout.write('\nSearching...');
    const results = await tmdbGet(`/search/movie?query=${encodeURIComponent(searchTitle)}&language=en-US`);
    console.log('\n');

    if (!results.results?.length) {
      console.log('No results found on TMDB.');
      rl.close();
      return;
    }

    const top = results.results.slice(0, 5);
    top.forEach((m, i) => {
      const year = m.release_date?.substring(0, 4) ?? '?';
      console.log(`  ${i + 1}. ${m.title} (${year})`);
    });

    let movie;
    if (top.length === 1) {
      movie = top[0];
      console.log(`\nAuto-selected: ${movie.title}`);
    } else {
      const pick = await prompt(rl, '\nPick (1-5): ');
      const idx = parseInt(pick, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= top.length) {
        console.log('Invalid selection.');
        rl.close();
        return;
      }
      movie = top[idx];
    }

    const filmTitle = movie.title;
    const filmYear = movie.release_date?.substring(0, 4) ?? '';
    const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : '';
    console.log(`\n✓ ${filmTitle} (${filmYear})${posterUrl ? ' — poster found' : ' — no poster available'}\n`);

    // Rating
    const ratingRaw = await prompt(rl, 'Rating (0.5–5): ');
    const rating = parseFloat(ratingRaw);
    if (isNaN(rating) || rating < 0.5 || rating > 5) {
      console.log('Invalid rating.');
      rl.close();
      return;
    }

    // Watched date
    const today = new Date().toISOString().substring(0, 10);
    const watchedRaw = await prompt(rl, `Watched date [${today}]: `);
    const watchedDate = watchedRaw.trim() || today;

    // Review text
    console.log('');
    const reviewText = await promptMultiline(rl, 'Review:');

    rl.close();

    // Build post
    const letterboxdSlug = toSlug(filmTitle);
    const letterboxdUrl = `https://letterboxd.com/${LETTERBOXD_USER}/film/${letterboxdSlug}/`;
    const postTitle = `${filmTitle} (${filmYear})`;
    const filename = toSlug(postTitle) + '.md';
    const outputPath = path.join(__dirname, '..', 'content', 'post', filename);

    if (fs.existsSync(outputPath)) {
      console.log(`\nFile already exists: content/post/${filename}`);
      return;
    }

    const ratingStr = formatRating(rating);
    const starStr = toStars(rating);

    const content = `---
title: "${postTitle}"
date: ${new Date().toISOString()}

categories: ["movie"]
tags: ["Movies", "Review"]
author: "Stephen"

# Movie specific metadata
movie:
  title: "${filmTitle}"
  year: ${filmYear}
  rating: ${ratingStr}
  stars: "${starStr}"
  poster: "${posterUrl}"
  letterboxd_url: "${letterboxdUrl}"
  watched_date: "${watchedDate}"

---

${posterUrl ? `![${filmTitle} Poster](${posterUrl})\n` : ''}
**Rating:** ${starStr} (${ratingStr}/5)

${reviewText}

---

*[View on Letterboxd](${letterboxdUrl})*
`;

    fs.writeFileSync(outputPath, content);
    console.log(`\n✓ Created: content/post/${filename}`);
    console.log(`  Letterboxd URL: ${letterboxdUrl}`);
    console.log(`  (verify the Letterboxd URL is correct before publishing)\n`);

  } catch (err) {
    console.error('\nError:', err.message);
    rl.close();
    process.exit(1);
  }
}

main();
