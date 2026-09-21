# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hugo-based static website using the [Mana Hugo theme](https://github.com/Livour/hugo-mana-theme). The site is Stephen Adams' personal blog/website hosted at https://www.thatstephenadams.com/

## Architecture

- **Hugo Static Site Generator**: Requires Hugo extended v0.100.0+ (CI installs `latest`; developed against v0.165). No Node/PostCSS build step — the theme's CSS/JS is bundled by Hugo Pipes.
- **Theme**: Mana, vendored as a git submodule at `themes/mana` (`theme = "mana"` in `hugo.toml`). Hugo Modules are **not** used anymore — `go.mod`/`go.sum` were removed when the site moved off the previous `beautifulhugo` module.
- **Configuration**: `hugo.toml` contains all site configuration
- **Content**: Markdown files in `content/`:
  - `post/` - Blog posts, movie reviews, and (auto-generated) podcast episodes live under URLs `/post/<slug>/`
  - `audio/` - Podcast episodes (Acast embeds) at `/audio/<slug>/`
  - `page/` - Static pages (How I Work, Life Rules, Podcasts) at `/page/<slug>/`
  - `archive/` - `_index.md` with `type: archive`; renders the theme's year/month archive
- **How the theme finds posts**: Mana lists content where `.Type == "posts"`. `content/post/_index.md` and `content/audio/_index.md` each carry a `cascade` (`_target: {kind: page}` → `type: posts`) so every episode/post — including future automation output — is picked up by the home feed, `/post/` list, archive and JSON search, while section names (and therefore URLs) stay `post` / `audio`.
- **Theme overrides** in the repo `layouts/`:
  - `layouts/post/list.html` - paginates the combined `type: posts` set so podcast episodes appear in the main `/post/` index, not just on the home page
  - `layouts/page/single.html` - clean layout for `page/` content (no post meta / related / prev-next)
  - `layouts/partials/social-links.html` - theme's partial plus Bluesky + YouTube icons
- **Comments**: opt-in Disqus threads are available for `/post/` articles only. They remain disabled until `params.comments.disqus.shortname` is set; see `docs/disqus.md`.
- **Deployment**: GitHub Actions workflow deploys to GitHub Pages on pushes to `published` branch

## Common Commands

### Development
```bash
# Start development server
hugo server

# Build site for production
hugo --minify
```

### Theme Development
The theme is a git submodule at `themes/mana`. After a fresh clone run `git submodule update --init --recursive`. To update the theme: `git -C themes/mana pull origin main` (then re-check the repo overrides in `layouts/` still match the theme's partials).

### Content Management
- Content is organized by type in the `content/` directory
- Each content type has specific frontmatter requirements
- English only (`defaultContentLanguage = "en"`)

### Helper scripts (`scripts/`)
- `podcast-automation.js` — pulls the latest episode from a show's Acast RSS and writes `content/post/<slug>.md`. Runs daily via `.github/workflows/podcast-automation.yml`.
- `create-review.js` (`npm run review`) — interactive CLI to author a movie-review post from TMDB search results (poster, title, year); the Letterboxd link it adds is a plain URL, not an API call.
- The old `movie-automation.js` / `movie-automation.yml` (auto-posting from Letterboxd RSS) were removed — Letterboxd blocks automated fetches.

## Key Configuration

- **Base URL**: https://www.thatstephenadams.com/
- **Theme**: `mana` (submodule at `themes/mana`)
- **Search**: Mana's built-in JSON full-text search (`[outputs] home = ["HTML", "RSS", "JSON"]` builds `/index.json`)
- **Comments**: none
- **Analytics**: none (Mana supports Umami via `[params.umami]` if wanted)
- **Code highlighting**: Chroma with `noClasses = false`; theme-aware Catppuccin (`[params.codeHighlight]`)

## Deployment

- Site deploys automatically via GitHub Actions (`.github/workflows/hugo.yml`) when pushing to `published` branch
- Checks out submodules recursively, installs Hugo extended (pinned in the workflow), builds to `public/`, deploys to GitHub Pages

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

- No Node/build toolchain is required to build the site — Hugo (extended) is the only dependency. `scripts/` has its own `package.json` (podcast/review helpers) that is unrelated to the site build.
- No Hugo Modules — the theme is the `themes/mana` git submodule; there is no `go.mod`.
- Only English is configured (`defaultContentLanguage = "en"`, no `[languages]` block).
- Custom layouts in the root `layouts/` directory override theme defaults (see the "Theme overrides" list above).
