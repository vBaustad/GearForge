import type { GuidePost } from "../types";

export const POSTS: GuidePost[] = [
    {
    slug: "legion-remix-phase-1-fast-route",
    imageTitle: "Legion Remix Fast Route",
    title: "Legion Remix Phase 1: Your No-Stress Fast Route (Val’sharah & Stormheim)",
    subtitle: "Let’s stack Infinite Knowledge early and breeze into raids + cosmetics",
    excerpt: "Hop in, grab your artifact, keep a Research daily rolling, and let Val’sharah + Stormheim do the heavy lifting. Here’s the why and the how—step by calm step.",
    cover: "images/key_art/custom/Lemix.jpg",
    tags: ["legion remix", "routes", "rewards", "knowledge", "guide"],
    author: "Gearforge Team",
    published: "2025-10-07",
    updated: "2025-10-07",
    content: [
      { type: "tldr", text: "Start simple: unlock your artifact, grab an **Infinite Research** daily in Dalaran, then head to **Val’sharah** or **Stormheim**. We’ll keep one eye on **Infinite Knowledge** at all times, hop between **Normal/Heroic** as needed, and knock out LFR raids when you hit max. You’ll come out stacked and stylish." },

      { type: "img", src: "images/key_art/custom/infinite-bazaar-dalaran-legion-remix.jpg", alt: "Infinite Bazaar hub", caption: "First stop: the Infinite Bazaar. Think of it as your Remix pit-stop—pick up Research, window-shop, keep moving." },

      { type: "h2", text: "Before we start: here’s the vibe" },
      { type: "p", text: "Legion Remix lands in phases. That matters because **Phase 1** lines up with **Emerald Nightmare** and **Trial of Valor**. If we anchor our route to **Val’sharah** and **Stormheim**, you’ll level, earn cosmetics, and set up raid progress—without ever feeling like you’re grinding checklists." },

      { type: "h2", text: "Pick a class you’ll actually enjoy (but here’s a nudge)" },
      { type: "p", text: "If you’re rolling solo and want speed with minimal fuss, hybrids are your friends—**DH, DK, Paladin, Druid, Monk, Priest**. You get big AOE, self-sustain, and quick dungeon queues. That said, if your main brings you joy, bring your main. This guide won’t punish you for it." },
      { type: "p", text: "On the artifact talents, go where the AOE lives. The **Holy** or **Fel** power trees spike early once you get their actives—perfect for mowing down packs while you quest." },

      { type: "img", src: "images/key_art/custom/artifact-tree-new.jpg", alt: "Artifact talent tree", caption: "Early goal: unlock an AOE active. It makes the whole route feel turbocharged." },

      { type: "h2", text: "Currencies, demystified (so you stop second-guessing)" },
      { type: "ul", items: [
        "**Bronze**: your fashion fund. Spend it. You’ll get more.",
        "**Artifactum Sand**: bumps your artifact **item level**.",
        "**Infinite Power**: invests into the **artifact talent tree**.",
        "**Infinite Knowledge**: the kingmaker. Each rank buffs Power gains **account-wide**. The earlier you stack this, the easier everything gets."
      ]},

      { type: "callout", tone: "tip", title: "Keep the engine humming", text: "At the Bazaar, pick up an **Infinite Research** daily. Finish one while doing other stuff, **turn it in, grab the next**. Can’t log daily? No stress—you can **bank up to 6** and knock them out together." },

      { type: "h2", text: "Your first hour (I’ll walk with you)" },
      { type: "p", text: "Log in. Do the short intro to **unlock your artifact**. You’ll get punted to **Dalaran**—swing by the **Infinite Bazaar**, grab a Research daily, and now we’re moving." },
      { type: "p", text: "Pick **Val’sharah** or **Stormheim** as your first zone. While you travel, **fly through the time anomalies and sky demons**. It’s pocket change—Bronze + Power—between objectives, but it adds up." },

      { type: "img", src: "images/key_art/custom/sky_demon.png", alt: "Flying through time anomaly", caption: "If it glows, go through it. Free speed-ups for the road." },

      { type: "h2", text: "Why these zones feel so good" },
      { type: "p", text: "Both **Val’sharah** and **Stormheim** are what I call “4-for-1 zones.” You quest once and progress four things: **Knowledge milestones**, **zone completion**, **dungeon/raid checks**, and **headline cosmetics**." },

      { type: "h3", text: "In Val’sharah, you’ll naturally…" },
      { type: "ul", items: [
        "Finish the **Lore Runner** storyline → +1 **Infinite Knowledge**.",
        "Tick the **Legion Dungeons** meta → +1 Knowledge.",
        "Later, clear **Emerald Nightmare (LFR+)** → +1 Knowledge + fat Bronze/Power.",
        "Pick up **Legion Slayer** by killing 50 empowered enemies → +1 Knowledge.",
        "Hit **Unlimited Power** (earn 10k Infinite Power) → +1 Knowledge.",
        "And unlock the **Fel Shatter Illusion** once your campaign + dungeon + raid pieces are in place."
      ]},

      { type: "h3", text: "Stormheim plays the same tune" },
      { type: "ul", items: [
        "Wrap the **Lore Runner** campaign → +1 Knowledge.",
        "Finish the **Legion Dungeons** meta → +1 Knowledge.",
        "Clear **Trial of Valor (LFR+)** → +1 Knowledge.",
        "And line up **Sinister Fel Arsenal** (4 fel-infused weapon transmogs) via campaign + dungeon + raid."
      ]},

      { type: "callout", tone: "info", title: "Alt bonus", text: "Fully completing a campaign zone grants **account-wide bonus XP** for alts. If you plan to spin up a second character, finish the zone instead of dipping out halfway." },

      { type: "hr" },

      { type: "h2", text: "Normal ↔ Heroic: when to flip" },
      { type: "p", text: "If everything melts, you’re leaving value on the table. **Flip to Heroic** for juicier XP/Bronze. If mobs start body-checking you, **drop to Normal**, get a gear bump, then pop back up. We’re surfing the difficulty to stay efficient, not proving anything to anyone." },
      { type: "h3", text: "Need your 50 empowered kills fast?" },
      { type: "p", text: "Try these loops (great solo, silly on tank specs):" },
      { type: "ul", items: [
        "**Stormheim (Bilgefin Shore, far east coast)**: dense murlocs, quick respawns.",
        "**Azsuna (Faronaar, west)**: demon packs that chain nicely.",
        "**Azsuna (coast by Academy)**: another tight murloc circuit."
      ]},

      { type: "img", src: "images/key_art/custom/WorldMap-Azsuna.jpg", alt: "Empowered farm map pins", caption: "Run big loops, tag everything, watch your bars fly. Get your 50, then back to the 4-for-1 plan." },

      { type: "h2", text: "Dungeon metas—fit them in early" },
      { type: "p", text: "While you’re questing, **queue for Phase-1 dungeons** to finish the early metas (**Threat of the Isles** / **Might of the Legion**). They feed your **Infinite Research → Infinite Knowledge** pipeline. The sooner it’s done, the faster your **account-wide** gains snowball." },

      { type: "h2", text: "Max level: quick wins first, then play" },
      { type: "p", text: "Hit max? Awesome. Start with **LFR Emerald Nightmare** and **Trial of Valor**. That’s two clean **Knowledge** hits plus chunky Bronze/Power and the cosmetic checks, assuming your campaign + dungeon bits are wrapped." },
      { type: "p", text: "From there, scoop **Broken Isles world bosses** as they rotate (they feed **Might of the Legion** for another Knowledge), and knock out a **Timeworn +7** for **Timeworn Challenger** (+1 Knowledge). If Mythic+ isn’t your thing, do the +7 and peace out." },

      { type: "img", src: "images/key_art/custom/world-of-warcraft-legion-emerald-nightmare-mythic-difficulty-goes-live.avif", alt: "LFR queue for Emerald Nightmare", caption: "LFR first: fast Knowledge, big payouts, cosmetic unlock checks. Low stress, high value." },

      { type: "h2", text: "Your maintenance loop (a tiny weekly ritual)" },
      { type: "ul", items: [
        "Keep a **Research daily** active (bank up to 6 if life is busy).",
        "Flip **Normal ↔ Heroic** depending on how strong you feel—tag empowered mobs while doing world stuff.",
        "Pick off **reputations** you care about for cosmetics. This is your fashion endgame."
      ]},

      { type: "h2", text: "Quick recap (so you never feel lost)" },
      { type: "ol", items: [
        "Unlock **artifact** → grab **Research** at the Bazaar.",
        "Quest **Val’sharah** or **Stormheim** first; fly through anomalies along the way.",
        "Always be nudging **Infinite Knowledge** (zone lore, dungeon metas, 50 empowered, 10k Power).",
        "Ride the **Normal/Heroic** wave for best time-to-reward.",
        "At max: **LFR EN + ToV**, world bosses, **Timeworn +7**. Then chill maintenance."
      ]},

      { type: "callout", tone: "success", title: "End result", text: "You’ll lock in the **Phase-1 cosmetics**, feel your **Knowledge** ranks carry every alt, and skip the mindless grind. The whole point is momentum—set it up once, and everything after feels easy." }
    ]
  },
  {
    slug: "legion-remix-overview",
    imageTitle: "Legion Remix",
    title: "Legion Remix — Everything You Need to Know",
    excerpt:
      "Dates, phases, leveling, Heroic World Tier, artifact tree, gearing, Mythic+, raids, and the big cosmetic reward chase.",
    cover: "images/key_art/custom/WoW-Legion-Remix.jpg",
    tags: ["legion", "remix", "overview", "guide"],
    author: "Gearforge Team",
    published: "2025-09-24",
    updated: "2025-09-24",
    content: [
      { type: "tldr", text: "Phased event from Oct 7/8 through mid-Jan. Level 10→80 in Legion zones, power up a universal artifact tree with Infinite Power, and farm Bronze to buy (almost) every Legion cosmetic. Mythic+, daily-reset raids, and Heroic World Tier are your big progression loops." },

      { type: "h2", text: "What is Legion Remix?" },
      { type: "p", text: "Legion Remix is a limited-time mode with a phased rollout and a massive cosmetics chase. Progress a universal artifact tree, farm Bronze, and clear Legion raids and dungeons on a daily cadence." },

      { type: "img", src: "images/key_art/custom/remix-bazaar.jpg", alt: "Infinite Bazaar hub", caption: "The Infinite Bazaar — your hub for vendors, upgrades, and the Heroic World Tier console." },

      { type: "hr" },

      { type: "h2", text: "Release windows & phases" },
      { type: "ol", items: [
        "Launch: Oct 7/8 (region-dependent) — “Skies of Fire”: Broken Isles leveling + Emerald Nightmare & Trial of Valor.",
        "Two weeks later — “Rise of the Nightfallen”: Insurrection story, new world quests, Return to Karazhan, Nighthold.",
        "Nov 4 — “Legionfall”: Broken Shore, assaults, Cathedral of Eternal Night, Tomb of Sargeras.",
        "Nov 18 — “Argus Eternal”: Argus campaign, Seat of the Triumvirate, Antorus.",
        "Dec 9 — “Infinite Echoes”: catch-up, remix updates, extra rewards."
      ]},
      { type: "p", text: "Event is scheduled to complete Jan 19/20 (region-dependent)." },

      { type: "hr" },

      { type: "h2", text: "Leveling & access" },
      { type: "ul", items: [
        "Start at level 10; level to 80 in scaled Broken Isles zones.",
        "All races are available; classes are the original Legion 12 (Evoker excluded).",
        "Extra character slots are granted for Remix.",
        "Dungeons open at 10; Heroic dungeons and Normal/LFR raids at 20; world quests at 30; Heroic/Mythic raids and Mythic dungeons at 80.",
        "Time-Warped Obelisks randomly spawn buffs during leveling (with achievements attached).",
        "Mission table steps in class hall campaigns are auto-skipped to remove old time-gates."
      ]},

      { type: "callout", tone: "tip", title: "Account XP boosts", text: "Zone campaigns grant +10% XP each; intro steps add more; your first character unlocks +10% XP to your warband at levels 40 and 80, and each additional level-80 adds another +10%." },

      { type: "p", text: "Infinite Research Quests (daily, stack up to 6) ask you to kill mobs, run specific dungeons/raids, do skyriding activities, and more. They award power and account-wide XP bonuses; expect ~1–2% XP per quest with a high long-term cap." },

      { type: "hr" },

      { type: "h2", text: "Heroic World Tier" },
      { type: "ul", items: [
        "Toggle at the Console of Infinite Chaos in the Infinite Bazaar (south of Dalaran); exit with Temporal Retreat, spirit healer, or the console.",
        "Creatures hit harder, sometimes with extra affixes; in return, you gain much more Bronze and Infinite Power.",
        "While leveling, kill XP from mobs is +500%. Gear rewards from quests don’t scale up, but the currency & power gains do.",
        "Best used later in leveling or at 80 for efficient Bronze/Power farming."
      ]},

      { type: "hr" },

      { type: "h2", text: "Artifact tree & powers" },
      { type: "img", src: "images/key_art/custom/artifact-tree.jpg", alt: "Remix artifact tree", caption: "The universal artifact tree." },
      { type: "ul", items: [
        "Earned quickly via a short intro; alts can skip directly to the weapon.",
        "Upgrade item level with Artifactium Sand from Caches of Infinite Treasures, drops, and scrapping (cap 740, the global Remix ilvl cap).",
        "Universal artifact talent tree for all specs (stats differ by class/spec). The first node grants “Remix Time”: 1000% cooldown recovery for 3 seconds.",
        "Choose 1 of 5 flashy actives (forest stampede, dreadlord, arcane disc, storm burst, Lightforged beam) and layer on strong passives.",
        "Rings/neck/trinkets add extra ranks to tree nodes (green +1, blue +2, epic +3).",
        "The final “Endless” node scales to rank 999 (primary stat, stamina, +1% Vers per rank)."
      ]},

      { type: "callout", tone: "warning", title: "Power vs. account", text: "Infinite Power (the currency that buys artifact nodes) is per-character but shared across your specs’ artifacts. Infinite Knowledge is account-wide (+25% Power gain per point, up to 36) and is mostly earned from achievements across zones, dungeons, and raids." },

      { type: "hr" },

      { type: "h2", text: "Endgame gearing at 80" },
      { type: "ul", items: [
        "World/Caches gearing soft-caps around ~584 for epics; higher ilvl comes from Motes of Broken Time (combine 10 to create current-tier raid loot scaled to your average ilvl).",
        "Mythic+: all Legion dungeons are in the pool with original affixes plus 4 new Eternus Trials. Keys around +40 are the practical ceiling for most groups on PTR; above that scales sharply. Expect ~681 ilvl rewards at that tier (subject to tuning).",
        "Raids (daily reset) drop personal-loot scaled to your ilvl on ALL difficulties; higher difficulties mainly pay out more Bronze and Infinite Power.",
        "Scrapping returns Bronze/Power; a portable scrapper is available."
      ]},

      { type: "hr" },

      { type: "h2", text: "Leaving Remix" },
      { type: "p", text: "You can convert a Remix character back to regular realms at any time from the login screen (one-way). Characters receive a basic gear package, some gold, and move to your main game." },

      { type: "hr" },

      { type: "h2", text: "Rewards & cosmetics (Infinite Bazaar)" },
      { type: "ul", items: [
        "Bronze returns as the universal currency (account-wide; 1:1 transfers within your warband).",
        "Fel-themed class mounts: auto-granted at 80 on the class or purchasable for 20,000 Bronze each.",
        "Original class mounts return with the Legionfall phase via class hall quests.",
        "Dungeon/raid/outdoor ensembles from Legion (all difficulties), plus pre-patch appearances, new recolors, and ~40 new vendor mounts.",
        "High-end chases: mythic Trial of Valor no-death runs for Chosen Dead ensembles; Suramar achievements for an Azshara-inspired set; Broken Shore achievements for a fel-infused Shalamayne variant; Violet Spellwing tied to Heroic Antorus completion.",
        "Sargerai Commander sets: campaign completion, 100 world quests in Heroic World Tier, all Legion raids on Mythic, and a timeworn keystone +30 or higher."
      ]},

      { type: "callout", tone: "tip", title: "Bronze goals", text: "If you’re starting with few Legion collectibles, expect very high Bronze totals for a full clear—plan around steady daily raids, Mythic+, and Heroic World Tier loops." }
    ]
  },
  {
    slug: "brewfest-token-farming",
    imageTitle: "Brewfest Tokens",
    title: "How to Farm Brewfest Tokens Fast (2025)",
    excerpt: "Create throwaway alts, queue Coren Direbrew, and funnel Brewfest tokens to your warband bank — unlimited farming until Blizzard patches it.",
    cover: "images/key_art/custom/brewfest-brewfest-at-ironforge.jpg",
    tags: ["brewfest", "holiday", "tokens", "farming"],
    author: "Gearforge Team",
    published: "2025-09-24",
    updated: "2025-09-24",
    content: [
      {
        type: "tldr",
        text: "Create L10 alt → Queue Coren Direbrew → Kill & loot chest → Deposit via Warband Bank → Delete → Repeat. ~10–15 tokens/run (+40 once via Direbrew’s quest)."
      },
      {
        type: "p",
        text: "This loop abuses two things Brewfest currently allows: (1) level 10 characters can queue Coren Direbrew directly, and (2) Brewfest Prize Tokens are warbound, so you can funnel them into your Warband Bank and spend them on your main. By rapidly creating level-10 alts (Heritage races start at level 10), you can chain extremely short Coren kills, loot the Keg-Shaped Treasure Chest, and immediately bank the tokens from anywhere using the Warband Bank Distance Inhibitor. Since each run yields ~10–15 tokens, and Direbrew’s one-time quest grant is another +40 per character, you can buy out the entire vendor (~9k tokens from scratch) far faster than daily quests or ram racing would allow."
      },
      {
        type: "ol",
        items: [
          "Create a level 10 (Heritage races start at 10). Mag’har Orc monk is great for fast queues.",
          "Queue for Coren Direbrew via the dungeon finder (any role works).",
          "Kill Coren and loot the Keg-Shaped Treasure Chest (≈10–15 tokens).",
          "Use the Warband Bank Distance Inhibitor to deposit tokens to your warband bank.",
          "Log out, delete the character, recreate, and repeat."
        ]
      },
      { type: "hr" },
      {
        type: "p",
        text: "Efficiency tips: queue as a healer or tank spec (Monk is perfect) for instant pops; park your character in Orgrimmar/Ironforge to shorten travel; and always open the reward before banking so the tokens exist in your bags. If you’re sensitive to name creation or mailbox clutter, recycle a small pool of alts instead of deleting, but deletion generally remains faster for pure token-per-minute."
      },
      {
        type: "callout",
        tone: "warning",
        title: "Important",
        text: "This method may be patched at any time. Farm early if you want to benefit."
      }
    ]
  },  
  {
    slug: "reduce-spell-clutter",
    imageTitle: "Improve Performance",
    title: "Reduce spell clutter in big pulls",
    excerpt: "Simple client toggles that cut visual noise without touching DPS. Great for raid trash and AoE weeks.",
    cover: "/images/key_art/World of Warcraft The War Within Content Update 1115 Launch Screenshots/WoW_The_War_Within_11.1.5_Nightfall_Encounters_011.png",
    tags: ["ui", "performance", "m+"],
    author: "Gearforge Team",
    published: "2025-09-10",
    updated: "2025-09-12",
    content: [
      { type: "p", text: "Spell Density controls how many friendly and neutral spell visuals are rendered around you. After 11.2 a bug caused changes to have no effect. Until the hotfix lands, use the commands below to force a lower density in heavy pulls." },
      { type: "callout", tone: "tip", title: "What value should I use?", text: "1 = Low (fewest extra visuals), 2 = Medium, 3 = High, 4 = Ultra (most visuals). For raiding/M+ we recommend 1–2 on lower-end GPUs, 2–3 on mid-high GPUs." },
      { type: "p", text: "Apply the hotfix in-game via the console (chat) command:" },
      { type: "code", label: "Console (apply)", lang: "txt", content: "/console set spellVisualDensityFilterSetting 1" },
      { type: "p", text: "If you prefer using the CVar API (macro or script), this does the same:" },
      { type: "code", label: "CVar (apply)", lang: "lua", content: "SetCVar(\"spellVisualDensityFilterSetting\", 1)" },
      { type: "p", text: "You can revert later to the default by setting it back to 4:" },
      { type: "code", label: "Console (revert)", lang: "txt", content: "/console set spellVisualDensityFilterSetting 4" },
      { type: "code", label: "CVar (revert)", lang: "lua", content: "SetCVar(\"spellVisualDensityFilterSetting\", 4)" },
      { type: "callout", tone: "warning", title: "Heads up", text: "CVars are account-wide unless otherwise noted. Changing this affects all characters until you change it back." },
      { type: "p", text: "How to verify it worked: join a busy area (world boss, target dummy crowd), toggle between 1 and 4, and watch the number of non-essential swirls and projectile trails. Mechanics telegraphs are unaffected." },
      { type: "quote", source: "blizzard", originalUrl: "https://us.forums.blizzard.com/en/wow/t/is-the-new-spell-density-working/2143578/10" },
      { type: "p", text: "Edit: As of Wednesday, September 3, the issue has been fixed:" },
      { type: "quote", source: "blizzard", originalUrl: "https://us.forums.blizzard.com/en/wow/t/is-the-new-spell-density-working/2143578/19" },
    ],
  },
  {
    slug: "cloak-upgrade-macro",
    imageTitle: "Remote Cloak Upgrade",
    title: "Upgrade Your Reshii Wraps From Anywhere",
    excerpt: "Open the upgrade UI anywhere, apply the next valid rank, and avoid the trip to Zo’Shuul.",
    cover: "/images/key_art/World of Warcraft The War Within Ghosts of Karesh 112 Reveal Screenshots/WoW_The_War_Within_Ghosts_of_K_aresh_Reveal_Reshii_Wraps_(2).png",
    tags: ["macro", "upgrades"],
    author: "Gearforge Team",
    published: "2025-09-11",
    updated: "2025-09-25",
    content: [
      { type: "tldr", text: "This macro opens the Reshii Wraps upgrade UI anywhere." },
      { type: "p", text: "Normally you’d fly to Hashim in Overlook Zo’Shuul to upgrade your Reshii Wraps. With a tiny script you can summon the same interface from anywhere, check your next rank, and apply it when available." },
      { type: "code", label: "Open (toggle) Cloak Upgrade UI", lang: "lua", content: "/run GenericTraitUI_LoadUI()GenericTraitFrame:SetSystemID(29)GenericTraitFrame:SetTreeID(1115)ToggleFrame(GenericTraitFrame)" },
      { type: "p", text: "Drop the macro on your bar and bind a key. Press once to open. The UI shows your next eligible rank; click Upgrade." },
      { type: "hr" },
      { type: "p", text: "Prefer explicit open/close? Use these variants:" },
      { type: "code", label: "Always OPEN (no toggle)", lang: "lua", content: "/run GenericTraitUI_LoadUI()GenericTraitFrame:SetSystemID(29)GenericTraitFrame:SetTreeID(1115)ShowUIPanel(GenericTraitFrame)" },
      { type: "code", label: "CLOSE the UI", lang: "lua", content: "/run if GenericTraitFrame then HideUIPanel(GenericTraitFrame) end" },
      { type: "hr" },     
      { type: "callout", tone: "warning", title: "Limitations", text: "You must be out of combat to open most UI panels. If a major patch changes internal IDs, the macro may need an update. It doesn’t bypass travel restrictions for other vendors—this only opens the Reshii Wraps tree." },         
    ]
  }  
];
