# Product Requirements Document (PRD)
## GearForge - WoW Housing Design Sharing Platform

**Version:** 1.0
**Last Updated:** 2026-02-02
**Status:** Draft

---

## Executive Summary

GearForge pivots from a gear optimization tool to a **community platform for sharing WoW player housing designs**. Users can browse, upload, save, and share housing creations via import strings—similar to how WeakAuras or MDT routes are shared. The platform enables discovery through categories, search, and community engagement (likes/saves).

---

## Problem Statement

With WoW's new player housing feature, players spend hours creating elaborate designs but have **no centralized place to share and discover** housing creations. Current solutions are fragmented:
- Reddit posts get buried
- Discord links expire
- No way to browse by room type or style
- No import/export standardization

**GearForge solves this** by providing a dedicated platform for housing design discovery and sharing.

---

## Target Users

| Persona | Description | Primary Goal |
|---------|-------------|--------------|
| **Creator** | Players who build elaborate housing designs | Share creations, gain recognition |
| **Browser** | Players looking for inspiration or ready-made designs | Find and import quality designs quickly |
| **Casual** | Players who occasionally want to spruce up their house | Quick copy-paste of popular designs |

---

## Core User Flows

### Flow 1: Browse & Discover (No Auth Required)
```
Landing Page → Browse Gallery → Filter by Category → View Design → Copy Import String
```

### Flow 2: Upload Design (Auth Required)
```
Login with Blizzard → Create New → Paste Import String → Add Screenshots → Add Details → Publish
```

### Flow 3: Engage & Save (Auth Required)
```
View Design → Like Design → Save to Collection → View Saved Designs
```

### Flow 4: Creator Profile
```
View Creator → See All Creations → Follow Creator → See Stats
```

---

## Feature Specifications

### MVP Features (Phase 1)

#### F1: Public Gallery Browse
**Problem:** Users need to discover housing designs without friction.

**Solution:** Filterable gallery with categories, sorting, and search.

**User Stories:**
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| F1.1 | As a browser, I want to see a gallery of housing designs so I can find inspiration | Gallery shows design cards with thumbnail, title, creator, like count |
| F1.2 | As a browser, I want to filter by room category so I can find specific design types | Filter dropdown with: bedroom, living_room, kitchen, garden, tavern, throne_room, workshop, library, exterior, other |
| F1.3 | As a browser, I want to sort designs so I can find popular or new content | Sort by: newest, most liked, most viewed |
| F1.4 | As a browser, I want to search designs so I can find specific styles | Search by title, description, tags |

**Success Metrics:**
- Gallery page load < 2s
- Users browse 3+ designs per session
- Search used by 30% of visitors

---

#### F2: Design Detail Page
**Problem:** Users need to view full details and copy the import string.

**Solution:** Dedicated design page with all info and one-click copy.

**User Stories:**
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| F2.1 | As a browser, I want to view full design details so I can evaluate it | Shows: title, description, all screenshots, category, tags, items used, creator info |
| F2.2 | As a browser, I want to copy the import string easily so I can use it in-game | One-click "Copy Import String" button with confirmation toast |
| F2.3 | As a browser, I want to see the creator's other designs so I can explore their work | Creator card with link to profile + recent creations |
| F2.4 | As a browser, I want to report inappropriate content so the platform stays clean | Report button (requires auth) |

**Success Metrics:**
- Import string copied on 40% of detail page views
- Average time on page > 30s

---

#### F3: Blizzard OAuth Login
**Problem:** Users need to authenticate to engage and upload.

**Solution:** Battle.net OAuth integration for seamless WoW player auth.

**User Stories:**
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| F3.1 | As a user, I want to login with my Blizzard account so I don't need a new password | OAuth flow redirects to Battle.net, returns with BattleTag |
| F3.2 | As a user, I want to see my BattleTag displayed so I know I'm logged in | Header shows avatar + BattleTag with dropdown menu |
| F3.3 | As a user, I want to logout so I can switch accounts | Logout clears session, returns to home |

**Success Metrics:**
- Login conversion > 20% of unique visitors
- Auth flow completion > 90%

---

#### F4: Like & Save Designs
**Problem:** Users want to bookmark designs and show appreciation.

**Solution:** Like button + personal saved collection.

**User Stories:**
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| F4.1 | As a logged-in user, I want to like designs so I can show appreciation | Heart icon toggles like, count updates instantly |
| F4.2 | As a logged-in user, I want to save designs to a collection so I can find them later | Bookmark icon adds to "Saved" collection |
| F4.3 | As a logged-in user, I want to view my saved designs so I can access them quickly | "Saved" page in user menu shows all bookmarked designs |

**Success Metrics:**
- 50% of logged-in users like at least one design
- Average saves per user > 3

---

#### F5: Upload Design
**Problem:** Creators need to share their housing designs with the community.

**Solution:** Upload form with import string, screenshots, and metadata.

**User Stories:**
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| F5.1 | As a creator, I want to upload my design so others can use it | Form with: import string (required), title, description, category |
| F5.2 | As a creator, I want to add screenshots so users can preview my design | Image upload (1-5 images, max 5MB each, first = thumbnail) |
| F5.3 | As a creator, I want to add tags so my design is discoverable | Tag input (max 10 tags, suggestions from popular tags) |
| F5.4 | As a creator, I want to edit my published design so I can fix mistakes | Edit button on own designs, same form as upload |
| F5.5 | As a creator, I want to delete my design so I can remove unwanted content | Delete with confirmation, soft-delete in backend |

**Success Metrics:**
- 10% of logged-in users upload at least one design
- Average images per design > 2

---

#### F6: User Profile
**Problem:** Users want to see their activity and others want to discover creator portfolios.

**Solution:** Public profile page with creations and stats.

**User Stories:**
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| F6.1 | As a user, I want to view my profile so I can see my activity | Profile shows: avatar, BattleTag, member since, total creations, total likes received |
| F6.2 | As a user, I want to view another creator's profile so I can see their work | Public profile with same info (minus private data) + grid of their designs |
| F6.3 | As a user, I want to see my uploaded designs so I can manage them | "My Creations" tab with edit/delete options |

**Success Metrics:**
- Profile pages viewed for 30% of creators
- Creators with 2+ designs: 40%

---

### Phase 2 Features (Post-MVP)

#### F7: Collections (Folders)
Users can organize saved designs into named collections (e.g., "Tavern Ideas", "Cozy Bedrooms").

**ICE Score:** Impact: 6 | Confidence: 8 | Ease: 7 = **21**

---

#### F8: Follow Creators
Users can follow creators and see their new uploads in a feed.

**ICE Score:** Impact: 7 | Confidence: 7 | Ease: 6 = **20**

---

#### F9: Comments
Users can comment on designs to ask questions or give feedback.

**ICE Score:** Impact: 7 | Confidence: 6 | Ease: 5 = **18**

---

#### F10: Notifications
Users receive notifications for likes on their designs, new followers, comments.

**ICE Score:** Impact: 6 | Confidence: 7 | Ease: 5 = **18**

---

#### F11: Design Versioning
Creators can update import strings while keeping version history.

**ICE Score:** Impact: 5 | Confidence: 6 | Ease: 4 = **15**

---

### Premium Features (Monetization - Phase 3)

#### Premium Tier: "GearForge Pro" ($4.99/month or $39.99/year)

| Feature | Free | Pro |
|---------|------|-----|
| Browse designs | ✅ | ✅ |
| Copy import strings | ✅ | ✅ |
| Like designs | ✅ | ✅ |
| Upload designs | 5 max | Unlimited |
| Saved designs | 20 max | Unlimited |
| Collections | 1 | Unlimited |
| Screenshots per design | 3 | 10 |
| Priority in search | ❌ | ✅ |
| "Pro Creator" badge | ❌ | ✅ |
| Analytics (views, likes over time) | ❌ | ✅ |
| Early access to features | ❌ | ✅ |
| Ad-free experience | ❌ | ✅ |

**Why these limits?**
- Free tier is generous enough to be useful (most users won't hit limits)
- Pro appeals to serious creators who upload frequently
- Unlimited saves appeals to collectors/browsers
- Badge provides social status motivation

**ICE Score:** Impact: 8 | Confidence: 5 | Ease: 4 = **17**

---

#### Alternative: Tip Jar / Creator Support
Allow users to tip creators directly (GearForge takes 15% platform fee).

**Pros:** Aligns incentives, rewards quality
**Cons:** Payment complexity, tax implications

**ICE Score:** Impact: 6 | Confidence: 4 | Ease: 3 = **13**

*Recommendation: Start with Pro subscription, evaluate tip jar later.*

---

## MVP Scope Definition

### In Scope (MVP)
- [x] Public gallery with filtering/sorting
- [x] Design detail page with copy functionality
- [x] Blizzard OAuth login
- [x] Like designs
- [x] Save designs (simple list, no folders)
- [x] Upload design with screenshots
- [x] Basic user profile
- [x] Mobile-responsive design

### Out of Scope (MVP)
- [ ] Premium features / monetization
- [ ] Collections / folders
- [ ] Following creators
- [ ] Comments
- [ ] Notifications
- [ ] Design versioning
- [ ] Admin moderation panel (use manual DB queries initially)
- [ ] Social sharing (Twitter/Discord embeds)
- [ ] Item database integration (showing furniture used)

---

## Technical Constraints (from existing backend)

The Convex backend already implements:
- ✅ User schema with Blizzard auth fields
- ✅ Creations with all metadata (title, description, importString, images, category, tags)
- ✅ Likes with toggle functionality
- ✅ View count tracking
- ✅ Image upload via Convex storage
- ⚠️ Sessions table exists but OAuth flow needs frontend implementation
- ⚠️ "Saved" functionality needs adding (likes ≠ saves)

**Backend additions needed:**
1. `saves` table (userId, creationId) - separate from likes
2. OAuth callback handling (possibly Convex HTTP action)

---

## Success Metrics (MVP)

| Metric | Target (90 days post-launch) |
|--------|------------------------------|
| Monthly Active Users | 1,000 |
| Designs Uploaded | 500 |
| Import Strings Copied | 5,000 |
| Login Conversion | 20% |
| Creator Return Rate | 40% upload 2+ designs |
| Average Session Duration | 3 minutes |

---

## Launch Checklist

- [ ] All F1-F6 features implemented
- [ ] Mobile responsive tested
- [ ] Blizzard OAuth approved (may need app review)
- [ ] Error handling and loading states
- [ ] SEO meta tags per page
- [ ] Analytics tracking (Vercel Analytics)
- [ ] Terms of Service & Privacy Policy
- [ ] Seed with 20+ quality designs before launch
- [ ] Share on r/wow, WoW Discord servers

---

## Open Questions

1. **Saves vs Likes:** Should "save" be the same as "like" (simpler) or separate (more flexible)? *Recommendation: Separate - likes are public appreciation, saves are private bookmarks.*

2. **Import String Validation:** Should we validate import strings before publishing? *Recommendation: No for MVP, add later if spam becomes an issue.*

3. **Image Moderation:** How do we handle inappropriate screenshots? *Recommendation: User reports + manual review for MVP.*

4. **Rate Limiting:** How many designs can a user upload per day? *Recommendation: 10/day for free users to prevent spam.*

---

## Appendix: Page Map

```
/                       → Landing page (hero + featured designs)
/browse                 → Gallery with filters
/browse?category=tavern → Filtered gallery
/design/:id            → Design detail page
/design/:id/edit       → Edit design (creator only)
/upload                → Upload new design (auth required)
/profile/:id           → Public user profile
/me                    → Current user profile (auth required)
/me/saved              → Saved designs (auth required)
/login                 → Blizzard OAuth redirect
/login/callback        → OAuth callback handler
/terms                 → Terms of Service
/privacy               → Privacy Policy
```

---

*Document maintained by Product. For technical architecture, see `/docs/ARCHITECTURE.md`.*
