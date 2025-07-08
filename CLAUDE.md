# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hugo-based static website using the Bilberry Hugo Theme. The site is Stephen Adams' personal blog/website hosted at https://www.thatstephenadams.com/

## Architecture

- **Hugo Static Site Generator**: Uses Hugo v0.147.8 with extended features
- **Theme**: Bilberry Hugo Theme v4 (located in `themes/bilberry-hugo-theme/v4/`)
- **Configuration**: `hugo.toml` contains all site configuration
- **Content**: Markdown files in `content/` directory with various content types:
  - `article/` - Blog posts
  - `audio/` - Audio content/podcasts
  - `code/` - Code-related posts
  - `gallery/` - Image galleries
  - `page/` - Static pages
  - `quote/` - Quote posts
  - `video/` - Video content
- **Deployment**: GitHub Actions workflow deploys to GitHub Pages on pushes to `published` branch

## Common Commands

### Development
```bash
# Start development server
hugo server

# Build site for production
hugo --minify

# Get/update Hugo modules
hugo mod get
```

### Theme Development
The theme is included as a local copy in `themes/bilberry-hugo-theme/`. The v4 version is being used.

### Content Management
- Content is organized by type in the `content/` directory
- Each content type has specific frontmatter requirements
- Multi-language support is configured (English is default)

## Key Configuration

- **Base URL**: https://www.thatstephenadams.com/
- **Theme Path**: `bilberry-hugo-theme/v4`
- **Algolia Search**: Disabled (line 43 in hugo.toml)
- **Comments**: Disabled (Disqus, Giscus, Utterances all disabled)
- **Analytics**: Google Analytics ID is empty

## Deployment

- Site deploys automatically via GitHub Actions when pushing to `published` branch
- Uses Hugo v0.147.8 with Dart Sass
- Builds to `public/` directory
- Deployed to GitHub Pages

### Podcast Automation & PAT Setup

The podcast automation workflow requires a Personal Access Token (PAT) to trigger the Hugo deployment workflow. The `GITHUB_TOKEN` cannot trigger other workflows due to GitHub security restrictions.

**If the Hugo deployment stops triggering after podcast updates:**

1. **Check/Renew Personal Access Token**:
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Find the existing token or create a new one
   - Required permissions:
     - **Contents**: Read and write
     - **Metadata**: Read
     - **Pull requests**: Read
     - **Actions**: Read

2. **Update Repository Secret**:
   - Go to repository → Settings → Secrets and variables → Actions
   - Update the `PERSONAL_ACCESS_TOKEN` secret with the new token value

3. **Workflow Configuration**:
   - The podcast automation workflow uses `${{ secrets.PERSONAL_ACCESS_TOKEN }}` in the checkout step
   - This allows it to push to the `published` branch and trigger the Hugo deployment workflow

## Development Notes

- The theme includes Node.js dependencies that may need to be installed
- Hugo modules are used for dependency management
- Site supports multiple languages but currently only English is configured
- Custom layouts can be added in the root `layouts/` directory to override theme defaults