import { z } from "zod";

// URL validation helpers
export const urlSchema = z.string().url().max(500);
export const optionalUrlSchema = z.string().max(500).refine(
  (val) => val === "" || z.string().url().safeParse(val).success,
  { message: "Must be a valid URL" }
).optional();

// Twitch URL validation
export const twitchUrlSchema = z.string().max(200).refine(
  (val) => {
    if (val === "") return true;
    // Allow full URLs or just usernames
    if (val.includes("twitch.tv")) return true;
    if (val.startsWith("https://")) return z.string().url().safeParse(val).success;
    // Username only - alphanumeric and underscores, 4-25 chars
    return /^[a-zA-Z0-9_]{4,25}$/.test(val);
  },
  { message: "Must be a valid Twitch URL or username" }
).optional();

// YouTube URL validation
export const youtubeUrlSchema = z.string().max(200).refine(
  (val) => {
    if (val === "") return true;
    if (val.includes("youtube.com") || val.includes("youtu.be")) return true;
    if (val.startsWith("https://")) return z.string().url().safeParse(val).success;
    // Handle like a channel handle (alphanumeric, underscores, starting with @)
    return /^@?[a-zA-Z0-9_.-]{1,100}$/.test(val);
  },
  { message: "Must be a valid YouTube URL or channel handle" }
).optional();

// Bio validation
export const bioSchema = z.string().max(500, "Bio must be 500 characters or less").optional();

// Tip link URL patterns
const tipLinkPatterns = {
  buymeacoffee: /^(https?:\/\/)?(www\.)?buymeacoffee\.com\/[a-zA-Z0-9_.-]+\/?$/,
  kofi: /^(https?:\/\/)?(www\.)?ko-fi\.com\/[a-zA-Z0-9_]+\/?$/,
  paypal: /^(https?:\/\/)?(www\.)?paypal\.me\/[a-zA-Z0-9_.-]+\/?$/,
  patreon: /^(https?:\/\/)?(www\.)?patreon\.com\/[a-zA-Z0-9_]+\/?$/,
};

// Tip link validation schemas
export const tipLinkSchema = (platform: keyof typeof tipLinkPatterns) =>
  z.string().max(200).refine(
    (val) => {
      if (val === "" || val === undefined) return true;
      return tipLinkPatterns[platform].test(val);
    },
    { message: `Must be a valid ${platform} URL` }
  ).optional();

export const tipLinksSchema = z.object({
  buymeacoffee: tipLinkSchema("buymeacoffee"),
  kofi: tipLinkSchema("kofi"),
  paypal: tipLinkSchema("paypal"),
  patreon: tipLinkSchema("patreon"),
}).optional();

// Comment validation
export const commentContentSchema = z.string()
  .min(1, "Comment cannot be empty")
  .max(1000, "Comment must be 1000 characters or less")
  .refine(
    (val) => !/<script|javascript:|on\w+=/i.test(val),
    { message: "Comment contains invalid characters" }
  );

// User profile update schema
export const profileUpdateSchema = z.object({
  bio: bioSchema,
  twitchUrl: twitchUrlSchema,
  youtubeUrl: youtubeUrlSchema,
});

// Creation title - no XSS, reasonable length
export const creationTitleSchema = z.string()
  .min(3, "Title must be at least 3 characters")
  .max(100, "Title must be 100 characters or less")
  .refine(
    (val) => !/<script|javascript:|on\w+=/i.test(val),
    { message: "Title contains invalid characters" }
  );

// Creation description
export const creationDescriptionSchema = z.string()
  .max(2000, "Description must be 2000 characters or less")
  .refine(
    (val) => !/<script|javascript:|on\w+=/i.test(val),
    { message: "Description contains invalid characters" }
  )
  .optional();

// Import string - base64-like characters, reasonable size
export const importStringSchema = z.string()
  .min(10, "Import string is too short")
  .max(50000, "Import string is too long")
  .refine(
    (val) => /^[A-Za-z0-9+/=\s]+$/.test(val),
    { message: "Import string contains invalid characters" }
  );

// Category validation
export const categorySchema = z.enum([
  "bedroom",
  "tavern",
  "garden",
  "throne-room",
  "library",
  "kitchen",
  "outdoor",
  "other",
]);

// Tags validation
export const tagsSchema = z.array(z.string().min(1).max(30))
  .max(10, "Maximum 10 tags allowed")
  .refine(
    (tags) => tags.every(tag => !/<script|javascript:|on\w+=/i.test(tag)),
    { message: "Tags contain invalid characters" }
  )
  .optional();

// Creation schema
export const creationSchema = z.object({
  title: creationTitleSchema,
  description: creationDescriptionSchema,
  importString: importStringSchema,
  category: categorySchema,
  tags: tagsSchema,
});

// Report reason validation
export const reportReasonSchema = z.enum([
  "inappropriate",
  "spam",
  "stolen",
  "broken",
  "other",
]);

// Report details
export const reportDetailsSchema = z.string()
  .max(1000, "Details must be 1000 characters or less")
  .refine(
    (val) => !/<script|javascript:|on\w+=/i.test(val),
    { message: "Details contain invalid characters" }
  )
  .optional();

// Report submission schema
export const reportSchema = z.object({
  reason: reportReasonSchema,
  details: reportDetailsSchema,
});

// Collection name validation
export const collectionNameSchema = z.string()
  .min(1, "Collection name is required")
  .max(100, "Collection name must be 100 characters or less")
  .refine(
    (val) => !/<script|javascript:|on\w+=/i.test(val),
    { message: "Collection name contains invalid characters" }
  );

// Collection description
export const collectionDescriptionSchema = z.string()
  .max(500, "Description must be 500 characters or less")
  .refine(
    (val) => !/<script|javascript:|on\w+=/i.test(val),
    { message: "Description contains invalid characters" }
  )
  .optional();

// Collection schema
export const collectionSchema = z.object({
  name: collectionNameSchema,
  description: collectionDescriptionSchema,
  isPublic: z.boolean().optional(),
});

// Validation helper function
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Zod v4 uses issues instead of errors
  const issues = result.error.issues ?? (result.error as unknown as { errors?: { message: string }[] }).errors;
  const firstIssue = issues?.[0];
  return { success: false, error: firstIssue?.message || "Validation failed" };
}

// Sanitize text by removing potential XSS
export function sanitizeText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}
