import { mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Dummy data generators
const BATTLETAGS = [
  "DragonSlayer#1234",
  "ShadowMage#5678",
  "LightBringer#9012",
  "StormCaller#3456",
  "IronForge#7890",
  "MoonGuard#2345",
  "NightElf#6789",
  "BloodRaven#0123",
  "FrostWolf#4567",
  "SunWalker#8901",
  "ThunderKing#2468",
  "StarFire#1357",
  "DarkHunter#9753",
  "GoldLeaf#8642",
  "SilverWind#7531",
];

const CATEGORIES = [
  "bedroom",
  "living_room",
  "kitchen",
  "garden",
  "tavern",
  "throne_room",
  "workshop",
  "library",
  "exterior",
  "other",
] as const;

const DESIGN_TITLES = [
  "Cozy Mountain Retreat",
  "Elegant Royal Chamber",
  "Rustic Tavern Setup",
  "Enchanted Garden Oasis",
  "Medieval Kitchen Design",
  "Scholarly Library Nook",
  "Artisan's Workshop",
  "Noble Throne Room",
  "Peaceful Reading Corner",
  "Grand Entrance Hall",
  "Mystical Moon Garden",
  "Dwarven Forge Room",
  "Elven Forest Bedroom",
  "Pirate Captain's Quarters",
  "Alchemist's Laboratory",
  "Hunter's Lodge",
  "Mage's Study",
  "Warrior's Armory",
  "Healer's Sanctuary",
  "Merchant's Storeroom",
  "Festival Celebration Space",
  "Winter Wonderland Theme",
  "Autumn Harvest Design",
  "Spring Blossom Room",
  "Summer Beach Vibes",
];

const DESCRIPTIONS = [
  "A warm and inviting space perfect for relaxation after a long adventure.",
  "Inspired by the grand halls of Stormwind, this design brings royal elegance to any home.",
  "Perfect for hosting fellow adventurers and sharing tales of glory.",
  "A tranquil outdoor space filled with exotic plants and magical ambiance.",
  "Functional yet beautiful, this kitchen is ready for any feast.",
  "Thousands of tomes line the walls in this cozy reading space.",
  "Every tool in its place - the perfect crafting environment.",
  "Command respect from this imposing seat of power.",
  "Curl up with a good book in this peaceful corner.",
  "Welcome visitors with this impressive entrance design.",
  "Moonlight filters through enchanted crystals in this magical garden.",
  "The heat of the forge warms this industrious workspace.",
  "Nature and comfort blend seamlessly in this forest-themed room.",
  "Ahoy! Set sail from this nautical-themed living space.",
  "Bubbling potions and ancient tomes fill this mysterious lab.",
  "Trophies from countless hunts adorn this rustic lodge.",
  "Arcane energies swirl through this mystical study.",
  "Weapons and armor displayed in organized glory.",
  "A peaceful space dedicated to restoration and meditation.",
  "Wares from across Azeroth fill this merchant's dream.",
];

const TAGS = [
  "cozy",
  "elegant",
  "rustic",
  "modern",
  "medieval",
  "fantasy",
  "nature",
  "minimal",
  "maximalist",
  "warm",
  "cool",
  "dark",
  "bright",
  "romantic",
  "industrial",
  "vintage",
  "luxury",
  "simple",
  "detailed",
  "themed",
];

const BIOS = [
  "Passionate housing designer since Wrath. Love creating cozy spaces!",
  "Professional interior decorator bringing style to Azeroth.",
  "I make things look pretty. Sometimes they even match!",
  "Minimalist designer. Less is more.",
  "If it doesn't have at least 500 items, is it even decorated?",
  "Creating dream homes one room at a time.",
  "Tavern specialist. I know what adventurers want!",
  "Nature-inspired designs for the eco-conscious hero.",
  "Former architect, now full-time pixel decorator.",
  "Making Azeroth beautiful, one house at a time.",
];

const SAMPLE_COMMENTS = [
  "Love this design! Great work!",
  "How did you get those items to fit so perfectly?",
  "This is exactly what I was looking for!",
  "Amazing attention to detail!",
  "Can you share the import string?",
  "Wow, this must have taken forever!",
  "Inspiring work, definitely going to try this!",
  "The color coordination is perfect!",
  "This is my new favorite design!",
  "Do you do commissions?",
  "Incredible use of space!",
  "The lighting really sets the mood.",
  "I've been trying to recreate this for weeks!",
  "What's the budget cost for this?",
  "Beautiful work, following for more!",
];

// Blog post data
const BLOG_POSTS = [
  {
    title: "Getting Started with WoW Housing",
    slug: "getting-started-wow-housing",
    excerpt: "New to WoW housing? Here's everything you need to know to create your first amazing home in Azeroth.",
    content: `## Welcome to WoW Housing!

World of Warcraft housing is an exciting new way to express your creativity in Azeroth. Whether you're a seasoned decorator or just getting started, this guide will help you understand the basics.

### Understanding the Basics

Housing in WoW allows you to place **decor items** in your personal space. Each item has a budget cost, and your room has a maximum budget limit.

### Tips for Beginners

- Start simple - don't try to fill every corner
- Use the **preview mode** before placing items
- Look at other designs on GearForge for inspiration
- Experiment with different categories

### Finding Items

Items can be obtained through:
- Vendors in major cities
- Quest rewards
- Achievement unlocks
- Profession crafting

Happy decorating!`,
    tags: ["guide", "beginner", "tips"],
  },
  {
    title: "Top 10 Decor Items Every Home Needs",
    slug: "top-10-decor-items",
    excerpt: "Discover the must-have decor items that will transform any WoW housing space from bland to beautiful.",
    content: `## Essential Decor Items

After reviewing thousands of designs on GearForge, we've identified the most versatile and beloved items.

### 1. Ornate Rugs
Nothing grounds a space like a good rug. They define areas and add warmth.

### 2. Wall Sconces
Lighting is everything! Wall sconces add ambiance without taking floor space.

### 3. Potted Plants
Bring life to any room with greenery. Works in every design style.

### 4. Book Stacks
Add intellectual charm and fill empty surfaces beautifully.

### 5. Comfortable Seating
Every home needs places to sit. Mix styles for visual interest.

### 6. Storage Chests
Both functional and decorative. Great for corners.

### 7. Window Treatments
Curtains and drapes soften hard edges.

### 8. Table Settings
Plates, cups, and food items make spaces feel lived-in.

### 9. Wall Art
Paintings and tapestries fill empty walls with personality.

### 10. Candles
Atmosphere creators that work anywhere.

What are your essential items? Share in the comments!`,
    tags: ["tips", "decor", "top-10"],
  },
  {
    title: "Creating a Cozy Bedroom Design",
    slug: "cozy-bedroom-design",
    excerpt: "Learn the secrets to creating a warm, inviting bedroom space in your WoW home with these design principles.",
    content: `## The Art of Cozy

A bedroom should feel like a retreat. Here's how to achieve that cozy feeling.

### Color Temperature

Warm colors (oranges, browns, golds) create coziness. Cool colors (blues, silvers) feel more formal.

### Layering Textures

Mix different materials:
- Soft fabrics (rugs, curtains)
- Hard surfaces (wood, stone)
- Organic elements (plants, flowers)

### Lighting Matters

- Use multiple light sources
- Avoid harsh overhead lighting
- Candles add warmth

### The "Lived-In" Look

- Unmade beds feel realistic
- Scattered books and items
- Personal touches like photos

### Space Planning

- Don't block pathways
- Create a focal point (usually the bed)
- Leave breathing room

Try these tips and share your cozy creations on GearForge!`,
    tags: ["bedroom", "cozy", "design-tips"],
  },
];

// Changelog entries data
const CHANGELOG_ENTRIES = [
  {
    version: "1.0.0",
    title: "GearForge Launch",
    content: "Initial release of GearForge with design sharing, likes, and user profiles.",
    type: "feature" as const,
  },
  {
    version: "1.1.0",
    title: "Comments System",
    content: "You can now comment on designs and reply to other comments. Build connections with fellow decorators!",
    type: "feature" as const,
  },
  {
    version: "1.1.1",
    title: "Performance Improvements",
    content: "Faster loading times for browse page and optimized image delivery.",
    type: "improvement" as const,
  },
  {
    version: "1.2.0",
    title: "Room Bundles",
    content: "Group multiple designs into coordinated room bundles. Perfect for sharing complete room setups!",
    type: "feature" as const,
  },
  {
    version: "1.2.0",
    title: "Collections",
    content: "Organize your favorite designs into personal collections. Make them public to share with the community.",
    type: "feature" as const,
  },
  {
    version: "1.2.1",
    title: "Fixed Upload Issues",
    content: "Resolved an issue where some users couldn't upload designs with special characters in titles.",
    type: "fix" as const,
  },
  {
    version: "1.3.0",
    title: "Blog & Changelog",
    content: "Stay up to date with our new blog for tips and guides, plus this changelog to track updates!",
    type: "feature" as const,
  },
];

// Collection names for seeding
const COLLECTION_NAMES = [
  "Cozy Favorites",
  "Medieval Inspiration",
  "Nature Themed",
  "Minimalist Designs",
  "Tavern Ideas",
  "Library Goals",
  "Garden Dreams",
  "Royal Chambers",
];

// Room bundle titles
const BUNDLE_TITLES = [
  "Complete Cozy Cottage",
  "Medieval Manor Set",
  "Elven Forest Retreat",
  "Dwarven Stronghold",
  "Mage Tower Collection",
  "Coastal Beach House",
  "Mountain Lodge Bundle",
  "Noble Estate Package",
];

// Random helpers
function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random items for a creation using real decor IDs from the database
function generateRandomItems(realDecorIds: number[]): { decorId: number; quantity: number }[] {
  if (realDecorIds.length === 0) {
    return [];
  }

  const itemCount = randomInt(8, 30);
  const items: { decorId: number; quantity: number }[] = [];

  for (let i = 0; i < itemCount; i++) {
    items.push({
      decorId: randomElement(realDecorIds),
      quantity: randomInt(1, 8),
    });
  }

  return items;
}

// Internal mutation to insert a creation (called from action)
export const insertCreation = internalMutation({
  args: {
    title: v.string(),
    description: v.string(),
    imageIds: v.array(v.id("_storage")),
    category: v.string(),
    tags: v.array(v.string()),
    items: v.array(v.object({ decorId: v.number(), quantity: v.number() })),
    creatorId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    viewCount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("creations", {
      title: args.title,
      description: args.description,
      importString: "",
      imageIds: args.imageIds,
      thumbnailId: args.imageIds[0], // First image as thumbnail
      category: args.category as any,
      tags: args.tags,
      items: args.items,
      creatorId: args.creatorId,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
      likeCount: 0,
      viewCount: args.viewCount,
      commentCount: 0,
      status: "published",
    });
  },
});

// Internal mutation to get decor IDs
export const getDecorIds = internalMutation({
  args: {},
  handler: async (ctx): Promise<number[]> => {
    const allDecorItems = await ctx.db.query("decorItems").collect();
    return allDecorItems.map(item => item.blizzardId);
  },
});

// Type for seed result
type SeedResult = {
  success: boolean;
  usersCreated: number;
  designsCreated: number;
  imagesUploaded: number;
  message: string;
};

// Seed the database with dummy data (action version with images)
export const seedDatabase = action({
  args: {
    userCount: v.optional(v.number()),
    designsPerUser: v.optional(v.number()),
    addInteractions: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<SeedResult> => {
    const userCount = args.userCount ?? 10;
    const designsPerUser = args.designsPerUser ?? 3;
    const addInteractions = args.addInteractions ?? true;

    console.log(`Seeding ${userCount} users with up to ${designsPerUser} designs each...`);

    // Get real decor IDs
    const realDecorIds: number[] = await ctx.runMutation(internal.seed.getDecorIds, {});
    if (realDecorIds.length === 0) {
      throw new Error("No decor items in database. Please sync decor items from Blizzard API first.");
    }
    console.log(`Found ${realDecorIds.length} real decor items to use`);

    // Fetch and store placeholder images (using picsum.photos)
    // We'll create a pool of images to reuse
    console.log("Fetching placeholder images...");
    const imagePool: Id<"_storage">[] = [];
    const numPlaceholderImages = 20; // Create a pool of 20 images

    for (let i = 0; i < numPlaceholderImages; i++) {
      try {
        // Fetch a random image from picsum (800x450 for 16:9 aspect)
        const imageUrl = `https://picsum.photos/800/450?random=${Date.now()}-${i}`;
        const response = await fetch(imageUrl);

        if (!response.ok) {
          console.log(`Failed to fetch image ${i}, skipping...`);
          continue;
        }

        const imageBlob = await response.blob();
        const storageId = await ctx.storage.store(imageBlob);
        imagePool.push(storageId);
        console.log(`Uploaded placeholder image ${i + 1}/${numPlaceholderImages}`);
      } catch (err) {
        console.log(`Error fetching image ${i}:`, err);
      }
    }

    console.log(`Created ${imagePool.length} placeholder images`);

    if (imagePool.length === 0) {
      console.log("Warning: No images could be fetched. Designs will have no images.");
    }

    // Create users and designs using internal mutation for DB operations
    const result: SeedResult = await ctx.runMutation(internal.seed.seedDatabaseInternal, {
      userCount,
      designsPerUser,
      addInteractions,
      imagePool,
      realDecorIds,
    });

    return result;
  },
});

// Internal mutation to do the actual database seeding
export const seedDatabaseInternal = internalMutation({
  args: {
    userCount: v.number(),
    designsPerUser: v.number(),
    addInteractions: v.boolean(),
    imagePool: v.array(v.id("_storage")),
    realDecorIds: v.array(v.number()),
  },
  handler: async (ctx, args): Promise<SeedResult> => {
    const { userCount, designsPerUser, addInteractions, imagePool, realDecorIds } = args;

    const now = Date.now();
    const userIds: Id<"users">[] = [];
    const creationIds: Id<"creations">[] = [];

    // Create users
    for (let i = 0; i < userCount; i++) {
      const battleTag = i < BATTLETAGS.length
        ? BATTLETAGS[i]
        : `User${i + 1}#${randomInt(1000, 9999)}`;

      const userId = await ctx.db.insert("users", {
        battlenetId: `seed_${i}_${Date.now()}`,
        battleTag,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(battleTag)}`,
        createdAt: now - randomInt(30, 365) * 24 * 60 * 60 * 1000,
        lastLoginAt: now - randomInt(0, 30) * 24 * 60 * 60 * 1000,
        role: i === 0 ? "admin" : i < 3 ? "moderator" : "user",
        banned: false,
        bio: i < BIOS.length ? BIOS[i] : undefined,
        tipLinks: i % 3 === 0 ? {
          kofi: `${battleTag.split("#")[0].toLowerCase()}`,
        } : undefined,
        badgeCount: 0,
      });

      userIds.push(userId);
      console.log(`Created user: ${battleTag}`);
    }

    // Create designs for each user
    for (const userId of userIds) {
      const numDesigns = randomInt(1, designsPerUser);

      for (let j = 0; j < numDesigns; j++) {
        const category = randomElement(CATEGORIES);
        const title = randomElement(DESIGN_TITLES);
        const description = randomElement(DESCRIPTIONS);
        const tags = randomElements(TAGS, randomInt(2, 5));

        // Pick 1-4 random images for this design
        const numImages = imagePool.length > 0 ? randomInt(1, Math.min(4, imagePool.length)) : 0;
        const designImages = randomElements(imagePool, numImages);

        const creationId = await ctx.db.insert("creations", {
          title,
          description,
          importString: "",
          imageIds: designImages,
          thumbnailId: designImages[0],
          category,
          tags,
          items: generateRandomItems(realDecorIds),
          creatorId: userId,
          createdAt: now - randomInt(1, 180) * 24 * 60 * 60 * 1000,
          updatedAt: now - randomInt(0, 30) * 24 * 60 * 60 * 1000,
          likeCount: 0,
          viewCount: randomInt(10, 500),
          commentCount: 0,
          status: "published",
        });

        creationIds.push(creationId);
      }
    }

    console.log(`Created ${creationIds.length} designs`);

    // Add interactions (likes, follows, comments)
    if (addInteractions && userIds.length > 1) {
      // Add likes
      let likeCount = 0;
      for (const creationId of creationIds) {
        const numLikes = randomInt(0, Math.min(userIds.length - 1, 15));
        const likers = randomElements(userIds, numLikes);

        for (const likerId of likers) {
          const creation = await ctx.db.get(creationId);
          if (creation && creation.creatorId !== likerId) {
            const existingLike = await ctx.db
              .query("likes")
              .withIndex("by_user_creation", (q) =>
                q.eq("userId", likerId).eq("creationId", creationId)
              )
              .first();

            if (!existingLike) {
              await ctx.db.insert("likes", {
                userId: likerId,
                creationId: creationId,
                createdAt: now - randomInt(0, 30) * 24 * 60 * 60 * 1000,
              });
              await ctx.db.patch(creationId, {
                likeCount: (creation.likeCount || 0) + 1,
              });
              likeCount++;
            }
          }
        }
      }
      console.log(`Created ${likeCount} likes`);

      // Add follows
      let followCount = 0;
      for (const followerId of userIds) {
        const numFollows = randomInt(1, Math.min(userIds.length - 1, 5));
        const toFollow = randomElements(
          userIds.filter(id => id !== followerId),
          numFollows
        );

        for (const followingId of toFollow) {
          const existingFollow = await ctx.db
            .query("follows")
            .withIndex("by_follower_following", (q) =>
              q.eq("followerId", followerId).eq("followingId", followingId)
            )
            .first();

          if (!existingFollow) {
            await ctx.db.insert("follows", {
              followerId: followerId,
              followingId: followingId,
              createdAt: now - randomInt(0, 60) * 24 * 60 * 60 * 1000,
            });
            followCount++;
          }
        }
      }
      console.log(`Created ${followCount} follows`);

      // Add some comments
      let commentCount = 0;
      for (const creationId of creationIds) {
        if (Math.random() > 0.4) {
          const numComments = randomInt(1, 5);
          const commenters = randomElements(userIds, numComments);

          for (const commenterId of commenters) {
            await ctx.db.insert("comments", {
              creationId: creationId,
              authorId: commenterId,
              content: randomElement(SAMPLE_COMMENTS),
              likeCount: randomInt(0, 5),
              replyCount: 0,
              status: "visible",
              createdAt: now - randomInt(0, 30) * 24 * 60 * 60 * 1000,
            });

            const creation = await ctx.db.get(creationId);
            if (creation) {
              await ctx.db.patch(creationId, {
                commentCount: (creation.commentCount || 0) + 1,
              });
            }
            commentCount++;
          }
        }
      }
      console.log(`Created ${commentCount} comments`);
    }

    // Create collections for some users
    const collectionIds: Id<"collections">[] = [];
    if (userIds.length > 0 && creationIds.length > 0) {
      for (let i = 0; i < Math.min(userIds.length, COLLECTION_NAMES.length); i++) {
        if (Math.random() > 0.5) {
          const collectionId = await ctx.db.insert("collections", {
            name: COLLECTION_NAMES[i],
            description: `A curated collection of ${COLLECTION_NAMES[i].toLowerCase()} designs.`,
            ownerId: userIds[i],
            isPublic: Math.random() > 0.3, // 70% public
            createdAt: now - randomInt(1, 60) * 24 * 60 * 60 * 1000,
            updatedAt: now - randomInt(0, 30) * 24 * 60 * 60 * 1000,
            itemCount: 0,
          });
          collectionIds.push(collectionId);

          // Add 2-5 random designs to the collection
          const itemsToAdd = randomElements(creationIds, randomInt(2, 5));
          for (const creationId of itemsToAdd) {
            await ctx.db.insert("collectionItems", {
              collectionId,
              creationId,
              addedAt: now - randomInt(0, 30) * 24 * 60 * 60 * 1000,
            });
          }
          await ctx.db.patch(collectionId, { itemCount: itemsToAdd.length });
        }
      }
      console.log(`Created ${collectionIds.length} collections`);
    }

    // Create room bundles
    const bundleIds: Id<"roomBundles">[] = [];
    if (userIds.length > 0 && creationIds.length >= 4) {
      for (let i = 0; i < Math.min(4, BUNDLE_TITLES.length); i++) {
        const creatorId = userIds[i % userIds.length];
        const bundleDesigns = randomElements(creationIds, randomInt(2, 4));

        const bundleId = await ctx.db.insert("roomBundles", {
          title: BUNDLE_TITLES[i],
          description: `A complete ${BUNDLE_TITLES[i].toLowerCase()} with ${bundleDesigns.length} coordinated designs.`,
          creatorId,
          designIds: bundleDesigns,
          category: randomElement(CATEGORIES),
          tags: randomElements(TAGS, randomInt(2, 4)),
          likeCount: randomInt(5, 50),
          viewCount: randomInt(50, 500),
          status: "published",
          createdAt: now - randomInt(1, 60) * 24 * 60 * 60 * 1000,
          updatedAt: now - randomInt(0, 30) * 24 * 60 * 60 * 1000,
        });
        bundleIds.push(bundleId);
      }
      console.log(`Created ${bundleIds.length} room bundles`);
    }

    // Create blog posts (from admin user)
    const adminUser = userIds[0]; // First user is admin
    if (adminUser) {
      for (const post of BLOG_POSTS) {
        const publishedAt = now - randomInt(1, 90) * 24 * 60 * 60 * 1000;
        await ctx.db.insert("blogPosts", {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          authorId: adminUser,
          tags: post.tags,
          status: "published",
          publishedAt,
          createdAt: publishedAt,
          updatedAt: publishedAt,
          viewCount: randomInt(50, 500),
        });
      }
      console.log(`Created ${BLOG_POSTS.length} blog posts`);

      // Create changelog entries
      for (const entry of CHANGELOG_ENTRIES) {
        const publishedAt = now - randomInt(1, 180) * 24 * 60 * 60 * 1000;
        await ctx.db.insert("changelogEntries", {
          version: entry.version,
          title: entry.title,
          content: entry.content,
          type: entry.type,
          authorId: adminUser,
          publishedAt,
          createdAt: publishedAt,
        });
      }
      console.log(`Created ${CHANGELOG_ENTRIES.length} changelog entries`);
    }

    return {
      success: true,
      usersCreated: userIds.length,
      designsCreated: creationIds.length,
      imagesUploaded: imagePool.length,
      message: `Seeded ${userIds.length} users with ${creationIds.length} designs, ${collectionIds.length} collections, ${bundleIds.length} bundles, ${BLOG_POSTS.length} blog posts, and ${CHANGELOG_ENTRIES.length} changelog entries`,
    };
  },
});

// Clear all seeded data (users with battlenetId starting with "seed_")
export const clearSeedData = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const seededUsers = users.filter(u => u.battlenetId.startsWith("seed_"));

    let deletedCreations = 0;
    let deletedLikes = 0;
    let deletedFollows = 0;
    let deletedComments = 0;
    let deletedSaves = 0;
    let deletedCollections = 0;
    let deletedBundles = 0;
    let deletedBlogPosts = 0;
    let deletedChangelogs = 0;
    const deletedImageIds: Id<"_storage">[] = [];

    for (const user of seededUsers) {
      const creations = await ctx.db
        .query("creations")
        .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
        .collect();

      for (const creation of creations) {
        // Collect image IDs for deletion
        for (const imageId of creation.imageIds) {
          deletedImageIds.push(imageId);
        }
        if (creation.thumbnailId) {
          deletedImageIds.push(creation.thumbnailId);
        }

        const likes = await ctx.db
          .query("likes")
          .withIndex("by_creation", (q) => q.eq("creationId", creation._id))
          .collect();
        for (const like of likes) {
          await ctx.db.delete(like._id);
          deletedLikes++;
        }

        const saves = await ctx.db
          .query("saves")
          .withIndex("by_creation", (q) => q.eq("creationId", creation._id))
          .collect();
        for (const save of saves) {
          await ctx.db.delete(save._id);
          deletedSaves++;
        }

        const comments = await ctx.db
          .query("comments")
          .withIndex("by_creation", (q) => q.eq("creationId", creation._id))
          .collect();
        for (const comment of comments) {
          await ctx.db.delete(comment._id);
          deletedComments++;
        }

        await ctx.db.delete(creation._id);
        deletedCreations++;
      }

      const userLikes = await ctx.db
        .query("likes")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const like of userLikes) {
        await ctx.db.delete(like._id);
        deletedLikes++;
      }

      const following = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", user._id))
        .collect();
      for (const follow of following) {
        await ctx.db.delete(follow._id);
        deletedFollows++;
      }

      const followers = await ctx.db
        .query("follows")
        .withIndex("by_following", (q) => q.eq("followingId", user._id))
        .collect();
      for (const follow of followers) {
        await ctx.db.delete(follow._id);
        deletedFollows++;
      }

      const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const session of sessions) {
        await ctx.db.delete(session._id);
      }

      const userComments = await ctx.db
        .query("comments")
        .withIndex("by_author", (q) => q.eq("authorId", user._id))
        .collect();
      for (const comment of userComments) {
        await ctx.db.delete(comment._id);
        deletedComments++;
      }

      // Delete collections
      const collections = await ctx.db
        .query("collections")
        .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
        .collect();
      for (const collection of collections) {
        // Delete collection items
        const collectionItems = await ctx.db
          .query("collectionItems")
          .withIndex("by_collection", (q) => q.eq("collectionId", collection._id))
          .collect();
        for (const item of collectionItems) {
          await ctx.db.delete(item._id);
        }
        await ctx.db.delete(collection._id);
        deletedCollections++;
      }

      // Delete room bundles
      const bundles = await ctx.db
        .query("roomBundles")
        .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
        .collect();
      for (const bundle of bundles) {
        // Delete bundle likes
        const bundleLikes = await ctx.db
          .query("roomBundleLikes")
          .withIndex("by_bundle", (q) => q.eq("bundleId", bundle._id))
          .collect();
        for (const like of bundleLikes) {
          await ctx.db.delete(like._id);
        }
        await ctx.db.delete(bundle._id);
        deletedBundles++;
      }

      // Delete blog posts (if admin)
      const blogPosts = await ctx.db
        .query("blogPosts")
        .withIndex("by_author", (q) => q.eq("authorId", user._id))
        .collect();
      for (const post of blogPosts) {
        await ctx.db.delete(post._id);
        deletedBlogPosts++;
      }

      // Delete changelog entries
      const changelogs = await ctx.db
        .query("changelogEntries")
        .collect();
      for (const entry of changelogs) {
        if (entry.authorId === user._id) {
          await ctx.db.delete(entry._id);
          deletedChangelogs++;
        }
      }

      await ctx.db.delete(user._id);
    }

    // Delete storage files
    const uniqueImageIds = [...new Set(deletedImageIds)];
    for (const imageId of uniqueImageIds) {
      try {
        await ctx.storage.delete(imageId);
      } catch {
        // Image might not exist or already deleted
      }
    }

    return {
      success: true,
      deletedUsers: seededUsers.length,
      deletedCreations,
      deletedLikes,
      deletedFollows,
      deletedComments,
      deletedSaves,
      deletedCollections,
      deletedBundles,
      deletedBlogPosts,
      deletedChangelogs,
      deletedImages: uniqueImageIds.length,
      message: `Cleared ${seededUsers.length} seeded users and their data`,
    };
  },
});

// Clear all data from the database (use with caution!)
export const clearAllData = mutation({
  handler: async (ctx) => {
    const creations = await ctx.db.query("creations").collect();
    const users = await ctx.db.query("users").collect();
    const likes = await ctx.db.query("likes").collect();
    const saves = await ctx.db.query("saves").collect();
    const sessions = await ctx.db.query("sessions").collect();
    const reports = await ctx.db.query("reports").collect();
    const follows = await ctx.db.query("follows").collect();
    const comments = await ctx.db.query("comments").collect();
    const collections = await ctx.db.query("collections").collect();
    const collectionItems = await ctx.db.query("collectionItems").collect();
    const roomBundles = await ctx.db.query("roomBundles").collect();
    const roomBundleLikes = await ctx.db.query("roomBundleLikes").collect();
    const blogPosts = await ctx.db.query("blogPosts").collect();
    const changelogEntries = await ctx.db.query("changelogEntries").collect();

    // Delete images from storage
    for (const creation of creations) {
      for (const imageId of creation.imageIds) {
        try {
          await ctx.storage.delete(imageId);
        } catch {
          // Ignore
        }
      }
    }

    for (const item of creations) {
      await ctx.db.delete(item._id);
    }
    for (const item of users) {
      await ctx.db.delete(item._id);
    }
    for (const item of likes) {
      await ctx.db.delete(item._id);
    }
    for (const item of saves) {
      await ctx.db.delete(item._id);
    }
    for (const item of sessions) {
      await ctx.db.delete(item._id);
    }
    for (const item of reports) {
      await ctx.db.delete(item._id);
    }
    for (const item of follows) {
      await ctx.db.delete(item._id);
    }
    for (const item of comments) {
      await ctx.db.delete(item._id);
    }
    for (const item of collections) {
      await ctx.db.delete(item._id);
    }
    for (const item of collectionItems) {
      await ctx.db.delete(item._id);
    }
    for (const item of roomBundles) {
      await ctx.db.delete(item._id);
    }
    for (const item of roomBundleLikes) {
      await ctx.db.delete(item._id);
    }
    for (const item of blogPosts) {
      await ctx.db.delete(item._id);
    }
    for (const item of changelogEntries) {
      await ctx.db.delete(item._id);
    }

    return {
      message: "Cleared all data",
      deleted: {
        creations: creations.length,
        users: users.length,
        likes: likes.length,
        saves: saves.length,
        sessions: sessions.length,
        reports: reports.length,
        follows: follows.length,
        comments: comments.length,
        collections: collections.length,
        collectionItems: collectionItems.length,
        roomBundles: roomBundles.length,
        roomBundleLikes: roomBundleLikes.length,
        blogPosts: blogPosts.length,
        changelogEntries: changelogEntries.length,
      }
    };
  },
});
