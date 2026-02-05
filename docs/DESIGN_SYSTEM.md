# GearForge Design System

A modern, dark-themed design system inspired by World of Warcraft's aesthetic. Built with Tailwind CSS v4 and designed for shadcn/ui integration.

---

## Color Palette

### Background Layers
Use these for depth hierarchy (darkest = base, lightest = overlay):

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#0d0c0b` | Page background |
| `surface` | `#161412` | Cards, panels |
| `surface-elevated` | `#1e1b18` | Hover states, dropdowns |
| `surface-overlay` | `#262220` | Modals, popovers |

### Foreground / Text

| Token | Hex | Usage |
|-------|-----|-------|
| `foreground` | `#f5f3f0` | Primary text |
| `foreground-muted` | `#a8a29e` | Secondary text |
| `foreground-subtle` | `#78716c` | Placeholders, hints |

### Gold Accent (Signature WoW Color)

```
gold-50   #fefce8  (lightest - rare use)
gold-100  #fef9c3
gold-200  #fef08a
gold-300  #fde047  (highlights)
gold-400  #facc15
gold-500  #d4a017  (PRIMARY - buttons, links)
gold-600  #b8860b  (hover states)
gold-700  #92690a  (active states)
gold-800  #78530d  (border accents)
gold-900  #653f12  (badge backgrounds)
```

### Semantic Colors

| Role | Default | Hover | Text |
|------|---------|-------|------|
| Primary | `#d4a017` | `#b8860b` | `#0d0c0b` |
| Secondary | `#262220` | `#332e2a` | `#f5f3f0` |
| Destructive | `#dc2626` | `#b91c1c` | `#fef2f2` |
| Success | `#16a34a` | - | `#f0fdf4` |

---

## Typography

### Font Stack

| Purpose | Font | Fallback |
|---------|------|----------|
| Display (headings) | Cinzel | Georgia, serif |
| Body | Inter | system-ui, sans-serif |
| Serif (quotes) | Crimson Text | Georgia, serif |
| Mono (code) | JetBrains Mono | monospace |

### Usage

```html
<!-- Headings automatically use Cinzel -->
<h1>Epic Tavern Design</h1>

<!-- Explicit font classes -->
<p class="font-display">Display text</p>
<p class="font-body">Body text</p>
<p class="font-serif">Serif quote</p>
<code class="font-mono">Import string</code>
```

### Scale (Tailwind defaults)

- `text-xs` - 12px (badges, captions)
- `text-sm` - 14px (secondary text)
- `text-base` - 16px (body)
- `text-lg` - 18px (emphasis)
- `text-xl` - 20px (card titles)
- `text-2xl` - 24px (section headers)
- `text-3xl` - 30px (page titles)
- `text-4xl` - 36px (hero headlines)
- `text-5xl` - 48px (landing hero)

---

## Components

### Cards

```html
<!-- Basic card -->
<div class="card p-6">
  Content here
</div>

<!-- Interactive card (for gallery items) -->
<div class="card-interactive p-4">
  <img src="..." class="rounded-md mb-3" />
  <h3 class="text-lg">Design Title</h3>
</div>
```

### Buttons

```html
<!-- Primary (gold) - main actions -->
<button class="btn btn-primary">Browse Designs</button>

<!-- Secondary - supporting actions -->
<button class="btn btn-secondary">Cancel</button>

<!-- Ghost - subtle actions -->
<button class="btn btn-ghost">Learn More</button>

<!-- Destructive - dangerous actions -->
<button class="btn btn-destructive">Delete</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>

<!-- Icon only -->
<button class="btn btn-ghost btn-icon">
  <HeartIcon />
</button>
```

### Inputs

```html
<input type="text" class="input" placeholder="Search designs..." />
<textarea class="input textarea" placeholder="Description..."></textarea>
```

### Badges

```html
<span class="badge">Tavern</span>
<span class="badge badge-outline">12 items</span>
<span class="badge badge-gold">Featured</span>
```

---

## Bento Grid System

### Basic Structure

The bento grid uses a 12-column system on desktop, 6 on tablet, 2 on mobile.

```html
<div class="bento-grid">
  <div class="bento-lg card">Large card (6 cols)</div>
  <div class="bento-md card">Medium card (4 cols)</div>
  <div class="bento-sm card">Small card (3 cols)</div>
  <div class="bento-full card">Full width (12 cols)</div>
</div>
```

### Size Classes

| Class | Desktop | Tablet | Mobile |
|-------|---------|--------|--------|
| `bento-sm` | 3 cols | 3 cols | 2 cols |
| `bento-md` | 4 cols | 3 cols | 2 cols |
| `bento-lg` | 6 cols | 6 cols | 2 cols |
| `bento-xl` | 8 cols | 6 cols | 2 cols |
| `bento-full` | 12 cols | 6 cols | 2 cols |

### Row Spanning

```html
<div class="bento-md bento-row-2">Tall card</div>
<div class="bento-lg bento-row-3">Very tall card</div>
```

---

## Layout Patterns

### Landing Page Hero (Bento)

```
┌─────────────────────────────────┬──────────────┐
│                                 │   Featured   │
│     Hero Text + CTA             │   Design 1   │
│     (bento-xl bento-row-2)      ├──────────────┤
│                                 │   Featured   │
│                                 │   Design 2   │
└─────────────────────────────────┴──────────────┘
┌──────────────┬──────────────┬──────────────────┐
│  Stat Card   │  Stat Card   │   Latest Design  │
│  (bento-sm)  │  (bento-sm)  │   (bento-lg)     │
└──────────────┴──────────────┴──────────────────┘
```

```html
<section class="bento-grid">
  <!-- Hero -->
  <div class="bento-xl bento-row-2 card p-8 flex flex-col justify-center">
    <h1 class="text-5xl mb-4">Share Your WoW Housing Creations</h1>
    <p class="text-foreground-muted mb-6">Discover, share, and import community designs</p>
    <div class="flex gap-3">
      <a href="/browse" class="btn btn-primary btn-lg">Browse Designs</a>
      <a href="/upload" class="btn btn-secondary btn-lg">Upload Yours</a>
    </div>
  </div>

  <!-- Featured designs -->
  <div class="bento-md card-interactive overflow-hidden">
    <img src="..." class="w-full h-48 object-cover" />
    <div class="p-4">
      <h3>Cozy Tavern</h3>
      <span class="badge">Tavern</span>
    </div>
  </div>
  <div class="bento-md card-interactive overflow-hidden">...</div>

  <!-- Stats row -->
  <div class="bento-sm card p-6 text-center">
    <p class="text-3xl font-display text-gold-500">1,234</p>
    <p class="text-foreground-muted">Designs Shared</p>
  </div>
  <div class="bento-sm card p-6 text-center">
    <p class="text-3xl font-display text-gold-500">567</p>
    <p class="text-foreground-muted">Creators</p>
  </div>
  <div class="bento-lg card-interactive overflow-hidden">
    <!-- Latest design spotlight -->
  </div>
</section>
```

### Browse Gallery

Use `gallery-grid` for consistent auto-fill layout:

```html
<div class="gallery-grid">
  <article class="card-interactive overflow-hidden">
    <img src="..." class="w-full aspect-video object-cover" />
    <div class="p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="badge">Bedroom</span>
        <span class="text-sm text-foreground-muted">142 likes</span>
      </div>
      <h3 class="text-lg mb-1">Moonlit Chamber</h3>
      <p class="text-sm text-foreground-muted">by Nightweaver#1234</p>
    </div>
  </article>
  <!-- More cards... -->
</div>
```

### Design Detail Page

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              Main Image Gallery                 │
│              (full width carousel)              │
│                                                 │
└─────────────────────────────────────────────────┘
┌───────────────────────────────┬─────────────────┐
│                               │                 │
│  Title, Description           │  Creator Card   │
│  Tags, Stats                  │  + Actions      │
│  (bento-xl)                   │  (bento-md)     │
│                               │                 │
└───────────────────────────────┴─────────────────┘
┌─────────────────────────────────────────────────┐
│                                                 │
│  Import String (copy box)                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Profile Page (Bento)

```
┌──────────────────────────┬──────────────────────┐
│                          │   Total Designs: 24  │
│  Avatar + BattleTag      ├──────────────────────┤
│  + Bio                   │   Total Likes: 1,234 │
│  (bento-lg)              ├──────────────────────┤
│                          │   Member Since: 2024 │
└──────────────────────────┴──────────────────────┘
┌─────────────────────────────────────────────────┐
│                                                 │
│  User's Designs (gallery-grid)                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Animations

### Built-in Classes

```html
<!-- Fade in on load -->
<div class="animate-fade-in">Content</div>

<!-- Slide up on load -->
<div class="animate-slide-up">Content</div>

<!-- Pulsing gold glow (for featured items) -->
<div class="animate-pulse-glow">Featured</div>
```

### Loading States

```html
<!-- Skeleton loader -->
<div class="skeleton h-48 w-full"></div>
<div class="skeleton h-4 w-3/4 mt-4"></div>
<div class="skeleton h-4 w-1/2 mt-2"></div>
```

---

## Shadows & Effects

| Class | Usage |
|-------|-------|
| `shadow-sm` | Subtle depth |
| `shadow-md` | Cards |
| `shadow-lg` | Dropdowns, elevated cards |
| `shadow-xl` | Modals |
| `shadow-glow` | Gold glow effect |
| `shadow-glow-lg` | Strong gold glow |

---

## Spacing Guidelines

- **Cards**: `p-4` to `p-6`
- **Section gaps**: `gap-6` to `gap-8`
- **Inline elements**: `gap-2` to `gap-3`
- **Page padding**: `px-4 md:px-6 lg:px-8`
- **Max content width**: `max-w-7xl mx-auto`

---

## Accessibility

- All interactive elements have `focus-ring` class for visible focus states
- Minimum contrast ratio: 4.5:1 for text
- Gold on dark passes WCAG AA
- All buttons/links have hover states
- Keyboard navigation supported

---

## shadcn/ui Integration

When adding shadcn/ui components, they will automatically inherit these CSS variables:

```bash
# Initialize shadcn (when ready)
npx shadcn@latest init

# Add components as needed
npx shadcn@latest add button card dialog input
```

The CSS variables in `index.css` are named to match shadcn conventions (`--color-primary`, `--color-secondary`, etc.) for seamless integration.

---

## File Structure

```
src/
├── index.css           # Design tokens + base styles
├── components/
│   └── ui/            # shadcn components go here
└── ...
```
