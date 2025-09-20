import type { Post } from "../types";

export const POSTS: Post[] = [
// add new posts above this line going forward
{
  id: "2025-09-20-sitewide-style-refresh",
  date: "2025-09-20",
  title: "Unified layout & darker cards across the site",
  blocks: [
    {
      kind: "paragraph",
      text:
        "We standardized page chrome across GearForge: one continuous black-glass board per page, clean section dividers, and darker inner cards for content. Headers are merged into the board for a tighter, more consistent feel."
    },
    {
      kind: "section",
      title: "Pages updated",
      items: [
        { text: "Landing — merged hero into a single board; nav tiles now use the darker inner-card skin." },
        { text: "Rewards — board surface for the page; Vault/Raid blocks sit inside inner cards." },
        { text: "Optimizer (input) — form lives inside an inner card within a continuous board." },
        { text: "Optimizer (results) — mast, ads, and results unified under one board; results in an inner card." },
        { text: "Guides Index — selector + grid each in their own inner card; board contains the whole flow." },
        { text: "Guide Article — cover image framed inside the board; article content in an inner card." },
        { text: "Class/Spec Guides — spec header merged; externals and internal guides in inner cards." },
        { text: "Changelog — stream sits inside a board; post cards retain light gray borders and accents." }
      ]
    },
    {
      kind: "section",
      title: "Design system",
      items: [
        { text: "Board surface: linear-gradient(#181a20 → #121318) with 1px #1f2024 border and subtle inner highlight." },
        { text: "Inner cards: rgba(0,0,0,.60) background, 1px #2a2c31 border, gentle hover emphasis." },
        { text: "Consistent spacing: 12–16px paddings; thin section dividers for rhythm." },
        { text: "Nav tiles: switched to the darker inner-card skin for visual consistency." },
        { text: "Mobile polish: stacked intros and tightened paddings while keeping readability." }
      ]
    },
    {
      kind: "section",
      title: "Behavior & SEO",
      items: [
        { text: "No route or metadata changes; existing canonicals and Open Graph images remain intact." }
      ]
    }
  ]
},
{
  id: "2025-09-20-changelog-launch",
  date: "2025-09-20",
  title: "Changelog: now live",
  blocks: [
    { kind: "paragraph", text: "We launched a lightweight in-page changelog so updates are easy to find and share." },
    {
      kind: "section",
      label: "list",
      title: "What you'll see",
      items: [
        { text: "Newest-first stream of updates." },
        { text: "Clear title and date for each entry; older posts collapse by default." },
        { text: "Concise headers with short points underneath." },
        { text: "Optional paragraphs and code blocks for context." },
        { text: "Copy-link per entry with deep-link scrolling to anchors." },
      ],
    },
  ],
},
{
    id: "2025-09-19-guides-watermarks-filters",
    date: "2025-09-19",
    title: "Guides hub, slot watermarks, and cleaner recommendations",
    blocks: [
        { kind: "paragraph", text: "A larger quality pass across recommendations and guidance." },

        {
        kind: "section",
        title: "Planner",
        items: [
            { type: "data",    text: "Achievement-based −5 crest discount is now auto-detected and applied in planning." },
            { type: "improve", text: "Per-slot watermarks respected: if you’ve previously looted a higher ilvl in a slot, we assume a free upgrade up to that watermark and plan from there." },
        ],
        },

        {
        kind: "section",
        title: "Filtering",
        items: [
            { type: "data", text: "Old-season items are filtered out of upgrade suggestions." },
        ],
        },

        {
        kind: "section",
        title: "Items",
        items: [
            { type: "fix", text: "Delve belt no longer appears as a crafted upgrade." },
            { type: "fix", text: "Crafted rings no longer show as false-positive upgrades." },
        ],
        },

        {
        kind: "section",
        title: "Guides",
        items: [
            { type: "new",  text: "New Guides page with direct links for every spec (Wowhead, Icy Veins, Method, Maxroll)." },
            { type: "note", text: "A couple of starter entries are live; more coming soon." },
        ],
        },

        {
        kind: "section",
        title: "Summary",
        items: [
            { text: "Fewer bugs, clearer upgrade logic." },
        ],
        },
    ],
},
{
    id: "2025-09-18-changelog-polish",
    date: "2025-09-18",
    title: "Changelog polish + UX bits",
    blocks: [
        { kind: "paragraph", text: "Small quality-of-life pass to make the changelog easier to scan and share." },
        {
        kind: "section",
        title: "Reading & sharing",
        items: [
            { type: "new",     text: "Copy-link button on each entry (deep links like /changelog#2025-09-20-guides-links)." },
            { type: "improve", text: "Auto-scroll to hash when opened from Discord or bookmarks." },
            { type: "improve", text: "Higher contrast on dark backgrounds for body text." },
        ],
        },
        {
        kind: "section",
        title: "Layout",
        items: [
            { type: "improve", text: "Tighter spacing on small screens for better density." },
            { type: "fix",     text: "Long lines wrap cleanly inside cards; no overflow." },
        ],
        },
        {
        kind: "section",
        title: "Refactor",
        items: [
            { type: "note", text: "Split into components: ChangelogPost, CopyAnchorButton, data/posts.ts." },
        ],
        },
    ],
},
];
