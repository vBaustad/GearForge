# Blizzard Housing Decor API

Documentation for Blizzard's World of Warcraft Housing API endpoints (added in patch 11.2.7).

## Base URL

```
https://{region}.api.blizzard.com
```

Regions: `us`, `eu`, `kr`, `tw`, `cn`

## Authentication

All endpoints require OAuth2 authentication. Use the client credentials flow with your Blizzard API credentials.

## Common Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| namespace | string | Yes | `static-{region}` (e.g., `static-us`) |
| locale | string | No | Locale for translations (e.g., `en_US`) |

---

## Decor Endpoints

### Decor Index
Returns an index of all decor items.

```
GET /data/wow/decor/index
```

**Parameters:**
- `namespace`: `static-{region}` (required)
- `locale`: e.g., `en_US` (optional)

---

### Decor by ID
Returns a specific decor item by ID.

```
GET /data/wow/decor/{decorId}
```

**Parameters:**
- `decorId`: The decor item ID (required)
- `namespace`: `static-{region}` (required)
- `locale`: e.g., `en_US` (optional)

**Example:** `/data/wow/decor/80?namespace=static-us&locale=en_US`

---

### Decor Search
Search for decor items by name or other fields.

```
GET /data/wow/search/decor
```

**Parameters:**
- `namespace`: `static-{region}` (required)
- `name.en_US`: Search by name (optional)
- `orderby`: Sort field, e.g., `id` (optional)
- `_page`: Page number for pagination (optional)

**Example:** `/data/wow/search/decor?namespace=static-us&name.en_US=Fireplace&orderby=id&_page=1`

---

## Fixture Endpoints

### Fixture Index
Returns an index of all fixtures.

```
GET /data/wow/fixture/index
```

**Parameters:**
- `namespace`: `static-{region}` (required)
- `locale`: e.g., `en_US` (optional)

---

### Fixture by ID
Returns a specific fixture by ID.

```
GET /data/wow/fixture/{fixtureId}
```

**Parameters:**
- `fixtureId`: The fixture ID (required)
- `namespace`: `static-{region}` (required)
- `locale`: e.g., `en_US` (optional)

**Example:** `/data/wow/fixture/141?namespace=static-us&locale=en_US`

---

### Fixture Search
Search for fixtures by name or other fields.

```
GET /data/wow/search/fixture
```

**Parameters:**
- `namespace`: `static-{region}` (required)
- `name.en_US`: Search by name (optional)
- `orderby`: Sort field, e.g., `id` (optional)
- `_page`: Page number for pagination (optional)

**Example:** `/data/wow/search/fixture?namespace=static-us&name.en_US=Roof&orderby=id&_page=1`

---

## Fixture Hook Endpoints

### Fixture Hook Index
Returns an index of all fixture hooks.

```
GET /data/wow/fixture-hook/index
```

**Parameters:**
- `namespace`: `static-{region}` (required)
- `locale`: e.g., `en_US` (optional)

---

### Fixture Hook by ID
Returns a specific fixture hook by ID.

```
GET /data/wow/fixture-hook/{fixtureHookId}
```

**Parameters:**
- `fixtureHookId`: The fixture hook ID (required)
- `namespace`: `static-{region}` (required)
- `locale`: e.g., `en_US` (optional)

**Example:** `/data/wow/fixture-hook/2503?namespace=static-us&locale=en_US`

---

### Fixture Hook Search
Search for fixture hooks.

```
GET /data/wow/search/fixture-hook
```

**Parameters:**
- `namespace`: `static-{region}` (required)
- `orderby`: Sort field, e.g., `id` (optional)
- `_page`: Page number for pagination (optional)

---

## Room Endpoints

### Room Index
Returns an index of all rooms.

```
GET /data/wow/room/index
```

**Parameters:**
- `namespace`: `static-{region}` (required)
- `locale`: e.g., `en_US` (optional)

---

### Room by ID
Returns a specific room by ID.

```
GET /data/wow/room/{roomId}
```

**Parameters:**
- `roomId`: The room ID (required)
- `namespace`: `static-{region}` (required)
- `locale`: e.g., `en_US` (optional)

**Example:** `/data/wow/room/1?namespace=static-us&locale=en_US`

---

### Room Search
Search for rooms by name or other fields.

```
GET /data/wow/search/room
```

**Parameters:**
- `namespace`: `static-{region}` (required)
- `name.en_US`: Search by name (optional)
- `orderby`: Sort field, e.g., `id` (optional)
- `_page`: Page number for pagination (optional)

**Example:** `/data/wow/search/room?namespace=static-us&name.en_US=Square&orderby=id&_page=1`

---

## Implementation Notes

### GearForge Schema

The Convex schema already has tables ready to cache this data:

```typescript
// convex/schema.ts
decorItems: defineTable({
  blizzardId: v.number(),
  name: v.string(),
  description: v.optional(v.string()),
  iconUrl: v.optional(v.string()),
  category: v.optional(v.string()),
  rarity: v.optional(v.string()),
  lastUpdated: v.number(),
}).index("by_blizzard_id", ["blizzardId"]),

fixtureItems: defineTable({
  blizzardId: v.number(),
  name: v.string(),
  description: v.optional(v.string()),
  iconUrl: v.optional(v.string()),
  category: v.optional(v.string()),
  lastUpdated: v.number(),
}).index("by_blizzard_id", ["blizzardId"]),

rooms: defineTable({
  blizzardId: v.number(),
  name: v.string(),
  description: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  lastUpdated: v.number(),
}).index("by_blizzard_id", ["blizzardId"]),
```

### Sync Strategy

1. **Initial Sync**: Fetch all items from index endpoints and store in Convex
2. **Incremental Updates**: Run weekly/monthly to catch new items
3. **On-Demand**: Fetch individual items when users reference unknown IDs

### Rate Limits

Blizzard API has rate limits. For bulk imports:
- Add delays between requests (100-200ms)
- Use pagination for search results
- Cache aggressively - game data changes rarely

---

## GearForge Implementation

### Files

- **`convex/gameData.ts`** - Queries and mutations for cached game data + sync actions
- **`convex/http.ts`** - HTTP endpoint to trigger sync via cron/webhook
- **`src/pages/AdminPage.tsx`** - Admin UI to view cache stats and trigger syncs

### Convex Queries (read from local cache)

```typescript
// Get all decor items (with optional filters)
api.gameData.getDecorItems({ category?, search?, limit? })

// Get single decor by Blizzard ID
api.gameData.getDecorByBlizzardId({ blizzardId })

// Get multiple decor items by IDs
api.gameData.getDecorByIds({ blizzardIds: [1, 2, 3] })

// Get all fixtures
api.gameData.getFixtureItems({ category?, search?, limit? })

// Get all rooms
api.gameData.getRooms()

// Get cache statistics
api.gameData.getCacheStats()

// Get unique decor categories
api.gameData.getDecorCategories()
```

### Sync Actions

```typescript
// Sync all game data
api.gameData.syncAllGameData({ clientId, clientSecret, region? })

// Sync individual types
api.gameData.syncDecorItems({ clientId, clientSecret, region? })
api.gameData.syncFixtureItems({ clientId, clientSecret, region? })
api.gameData.syncRooms({ clientId, clientSecret, region? })
```

### HTTP Endpoint

Trigger sync via HTTP (for cron jobs):

```bash
curl -X POST https://YOUR_CONVEX_URL.convex.site/api/sync-game-data \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"region": "us"}'
```

### Environment Variables (set in Convex Dashboard)

- `BLIZZARD_CLIENT_ID` - Blizzard API client ID
- `BLIZZARD_CLIENT_SECRET` - Blizzard API client secret
- `ADMIN_SECRET` - Secret for authenticating sync requests
