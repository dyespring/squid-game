# Deployment Guide

This guide covers how to deploy the Squid Game: Red Light, Green Light web game to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Production Build](#local-production-build)
- [Deploy to Vercel](#deploy-to-vercel)
- [Deploy to Netlify](#deploy-to-netlify)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)

---

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Git repository hosted on GitHub
- Vercel or Netlify account (free tier works)

---

## Local Production Build

Before deploying, test the production build locally:

### 1. Build the Project

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run tests
npm test

# Build for production
npm run build
```

### 2. Preview Production Build

```bash
# Serve the production build locally
npm run preview

# Open http://localhost:4173 in your browser
```

### 3. Check Build Output

The build output will be in the `dist/` directory:

```bash
# Check build size
du -sh dist

# Verify all assets are present
ls -lh dist/assets
```

**Expected build size:** < 2MB (including all assets)

---

## Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   # First deployment
   vercel

   # Production deployment
   vercel --prod
   ```

4. **Follow the prompts:**
   - Set up and deploy? **Yes**
   - Which scope? **Select your account**
   - Link to existing project? **No** (first time)
   - Project name? **squid-game** (or your preferred name)
   - Directory? **./** (current directory)

5. **Your game is now live!** 🎉

### Option 2: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)**

2. **Click "New Project"**

3. **Import your GitHub repository**

4. **Configure build settings:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Click "Deploy"**

6. **Wait for deployment to complete** (usually 1-2 minutes)

### Vercel Configuration

The project includes a `vercel.json` file with:
- Build configuration
- Caching headers for assets
- Security headers
- SPA routing support

---

## Deploy to Netlify

### Option 1: Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   # Build the project first
   npm run build

   # Deploy to Netlify
   netlify deploy --prod
   ```

4. **Select or create site** and follow prompts

### Option 2: Netlify Dashboard

1. **Go to [netlify.com](https://netlify.com)**

2. **Click "Add new site" → "Import an existing project"**

3. **Connect to GitHub** and select your repository

4. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

5. **Click "Deploy site"**

### Netlify Configuration

Create a `netlify.toml` file:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

---

## Environment Variables

This project uses Web Audio API and localStorage - no environment variables required.

If you add analytics or backend services in the future, configure environment variables in your hosting platform:

**Vercel:**
```bash
vercel env add VITE_ANALYTICS_ID
```

**Netlify:**
Via Dashboard → Site settings → Environment variables

---

## Post-Deployment

### 1. Test Your Deployment

Visit your deployed URL and test:
- ✅ All 3 difficulty modes work
- ✅ Scoring system functions correctly
- ✅ High scores persist across sessions
- ✅ Audio plays (after user interaction)
- ✅ Game is playable on mobile
- ✅ PWA installation prompt appears (mobile)

### 2. Performance Check

Use [Google PageSpeed Insights](https://pagespeed.web.dev/):
```
https://pagespeed.web.dev/?url=YOUR_DEPLOYMENT_URL
```

**Target scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### 3. Mobile Testing

Test on real devices:
- iOS Safari (iPhone)
- Chrome (Android)
- Various screen sizes

### 4. Set Up Custom Domain (Optional)

**Vercel:**
```bash
vercel domains add yourdomain.com
```

**Netlify:**
Via Dashboard → Domain settings → Add custom domain

### 5. Enable Analytics (Optional)

Consider adding:
- Google Analytics
- Plausible (privacy-friendly)
- Vercel Analytics (built-in)

---

## Continuous Deployment

Both Vercel and Netlify support automatic deployments:

1. **Push to main branch** → Automatic production deployment
2. **Push to other branches** → Preview deployments
3. **Pull requests** → Preview deployments with unique URLs

### GitHub Actions (Optional)

The project includes a CI/CD workflow (`.github/workflows/ci.yml`):
- Runs tests on every push
- Checks TypeScript types
- Runs linter
- Generates coverage report

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build
```

### Audio Doesn't Play

- Modern browsers require user interaction before playing audio
- The game handles this automatically on first touch/click
- Check browser console for errors

### High Scores Not Saving

- Ensure localStorage is enabled in browser
- Check browser privacy settings
- Test in incognito mode

### PWA Not Installing

- Requires HTTPS (provided by Vercel/Netlify)
- Service worker needs time to register
- Clear browser cache and try again

---

## Build Optimization

The production build includes:

✅ **Code splitting** - Phaser, React, and game code in separate chunks
✅ **Minification** - Terser with aggressive compression
✅ **Tree shaking** - Unused code removed
✅ **Asset optimization** - Images and audio compressed
✅ **Gzip compression** - All assets compressed
✅ **Cache headers** - Optimal caching strategy
✅ **No console logs** - Removed in production

---

## Monitoring

After deployment, monitor:

1. **Error Tracking:** Consider Sentry for error monitoring
2. **Analytics:** Track player engagement and completion rates
3. **Performance:** Monitor Core Web Vitals
4. **Uptime:** Use monitoring service (UptimeRobot, etc.)

---

## Rollback

If you need to rollback:

**Vercel:**
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote [deployment-url] --prod
```

**Netlify:**
Via Dashboard → Deploys → Click previous deploy → "Publish deploy"

---

## Cost Estimates

**Vercel (Hobby/Free Tier):**
- Bandwidth: 100GB/month
- Builds: 6000 minutes/month
- **Cost:** $0

**Netlify (Free Tier):**
- Bandwidth: 100GB/month
- Build minutes: 300/month
- **Cost:** $0

Both free tiers are more than sufficient for this project.

---

## Support

For deployment issues:
- Vercel: https://vercel.com/support
- Netlify: https://www.netlify.com/support/

---

**Ready to deploy?** 🚀

```bash
npm run build && vercel --prod
```

Your Squid Game is now live!
