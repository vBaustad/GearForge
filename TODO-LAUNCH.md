# GearForge Launch TODO

Manual tasks you need to do outside of code.

---

## HIGH PRIORITY - Do Before Launch

### Google Search Console
- [ ] Go to [Google Search Console](https://search.google.com/search-console)
- [ ] Add property: `https://gearforge.io`
- [ ] Choose "HTML tag" verification method
- [ ] Copy the verification code
- [ ] Update `index.html` line 63 - replace `YOUR_VERIFICATION_CODE` with your code
- [ ] Deploy and click "Verify" in Search Console
- [ ] Submit sitemap: `https://gearforge.io/sitemap.xml`

### Blizzard Developer Portal
- [ ] Go to [Blizzard Developer Portal](https://develop.battle.net/access/clients)
- [ ] **Add production redirect URI**: `https://gearforge.io/auth/callback`
- [ ] Verify localhost is also there for dev: `http://localhost:3000/auth/callback`

### Convex Production Environment
- [ ] In [Convex Dashboard](https://dashboard.convex.dev) → Settings → Environment Variables:
  - [ ] Set `BLIZZARD_CLIENT_ID`
  - [ ] Set `BLIZZARD_CLIENT_SECRET`
- [ ] Sync game data from Admin panel after deploy

### Buy Me a Coffee
- [ ] Verify your BMC page is set up at https://buymeacoffee.com/vbaustad
- [ ] Add a nice description/banner about GearForge

### Test Production
- [ ] Deploy to Vercel
- [ ] Test Blizzard OAuth login flow end-to-end
- [ ] Test upload flow (create design, images, import string)
- [ ] Test design page loads with correct SEO tags
- [ ] Check mobile responsiveness

---

## MEDIUM PRIORITY - First Week

### Social/Community
- [ ] Create a Twitter/X account for GearForge (or use personal)
- [ ] Post announcement in WoW housing communities:
  - [ ] Reddit: r/wow, r/wowhousing (if exists), r/woweconomy
  - [ ] WoW official forums
  - [ ] Discord servers (WoW housing, general WoW, class discords)
- [ ] Consider creating a Discord server for GearForge community

### Analytics
- [ ] Set up [Vercel Analytics](https://vercel.com/docs/analytics) (free tier)
- [ ] Or add [Plausible](https://plausible.io/) for privacy-friendly analytics

### Other Search Engines
- [ ] Submit to [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [ ] Bing often pulls from Google, but direct submission speeds it up

### Backlinks (SEO boost)
- [ ] Post helpful comment on Wowhead housing articles with link
- [ ] Submit to WoW fan site directories
- [ ] Reach out to WoW content creators/streamers

---

## LOW PRIORITY - Later

### Custom Domain
- [ ] Buy domain (e.g., gearforge.gg, gearforgewow.com)
- [ ] Configure in Vercel dashboard
- [ ] Update all URLs in code (sitemap, canonical, OG tags)

### Legal (if targeting EU)
- [ ] Review Privacy Policy content
- [ ] Review Terms of Service content
- [ ] Add cookie consent banner for GDPR

### Monitoring
- [ ] Set up Convex dashboard alerts
- [ ] Set up uptime monitoring ([UptimeRobot](https://uptimerobot.com/) free tier)
- [ ] Set up error tracking ([Sentry](https://sentry.io/) free tier)

---

## DONE ✓

### SEO
- [x] SEO meta tags per page
- [x] Next.js 15 App Router (full SSR)
- [x] Dynamic sitemap with all design URLs
- [x] Dynamic metadata for /design/[id] and /user/[id]
- [x] JSON-LD schemas (WebSite, Organization, FAQ, CreativeWork, etc.)
- [x] Open Graph / Twitter cards
- [x] robots.txt configured
- [x] noindex on admin/upload/edit pages
- [x] Targeted keywords (WoW housing, Midnight, TWW, etc.)

### Security
- [x] Session-based auth on all mutations
- [x] Rate limiting on all sensitive endpoints
- [x] Report button + moderation panel
- [x] Hydration warning suppression for Wowhead script

### Features
- [x] Browse with filters and search
- [x] Design upload with images
- [x] Like, Save, Follow functionality
- [x] User profiles with bio/social links
- [x] Edit/Delete designs
- [x] Settings page for profile editing
- [x] Items/Decor database with category filtering
- [x] Admin panel for moderation + game data sync
- [x] Category inference from item names

### UI/UX
- [x] Responsive design
- [x] Consistent design system
- [x] Grid/List view toggle on Items page
- [x] Shortened tab titles for easy navigation

### Accessibility
- [x] Skip link for keyboard navigation
- [x] ARIA labels on Header/Footer/Nav
- [x] Focus states on interactive elements

### Error Handling
- [x] Page-level error boundary (app/error.tsx)
- [x] Root-level error boundary (app/global-error.tsx)
- [x] Security headers in next.config.ts

### Testing & Documentation
- [x] Vitest test suite (24 tests passing)
- [x] README.md updated for housing platform
- [x] .env.example cleaned up

---

*Last updated: 2026-02-04*
