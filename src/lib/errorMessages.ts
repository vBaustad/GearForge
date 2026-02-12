/**
 * User-friendly error message mappings for Convex backend errors.
 * Maps technical error messages to helpful, actionable user messages.
 */

// Map of error message patterns to user-friendly messages
const errorPatterns: Array<{
  pattern: RegExp | string;
  message: string;
  field?: string; // Optional field name for form validation
}> = [
  // URL validation errors
  {
    pattern: /Invalid (buymeacoffee|kofi|paypal|patreon) URL format/i,
    message: "Please enter a valid URL. Example: buymeacoffee.com/yourname or https://ko-fi.com/yourname",
    field: "tipLinks",
  },
  {
    pattern: /Invalid buymeacoffee URL format/i,
    message: "Please enter a valid Buy Me a Coffee URL (e.g., buymeacoffee.com/yourname)",
    field: "buymeacoffee",
  },
  {
    pattern: /Invalid kofi URL format/i,
    message: "Please enter a valid Ko-fi URL (e.g., ko-fi.com/yourname)",
    field: "kofi",
  },
  {
    pattern: /Invalid paypal URL format/i,
    message: "Please enter a valid PayPal.me URL (e.g., paypal.me/yourname)",
    field: "paypal",
  },
  {
    pattern: /Invalid patreon URL format/i,
    message: "Please enter a valid Patreon URL (e.g., patreon.com/yourname)",
    field: "patreon",
  },

  // Authentication errors
  {
    pattern: /Unauthorized: Please log in/i,
    message: "Your session has expired. Please log in again.",
  },
  {
    pattern: /Unauthorized: Invalid or expired session/i,
    message: "Your session has expired. Please log in again.",
  },
  {
    pattern: /Invalid or expired session/i,
    message: "Your session has expired. Please log in again.",
  },
  {
    pattern: /Unauthorized: User not found or banned/i,
    message: "Your account is not available. Please contact support if you believe this is an error.",
  },
  {
    pattern: /User not found or banned/i,
    message: "Account not found. Please try logging in again.",
  },
  {
    pattern: /Session expired/i,
    message: "Your session has expired. Please log in again.",
  },

  // Permission errors
  {
    pattern: /Forbidden: You can only (edit|delete) your own/i,
    message: "You can only modify your own content.",
  },
  {
    pattern: /Forbidden: Admin access required/i,
    message: "This action requires administrator privileges.",
  },
  {
    pattern: /Forbidden: Only moderators/i,
    message: "This action requires moderator privileges.",
  },
  {
    pattern: /Forbidden: Admin or moderator access required/i,
    message: "This action requires moderator or admin privileges.",
  },

  // Comment errors
  {
    pattern: /Comment cannot be empty/i,
    message: "Please enter a comment before submitting.",
    field: "comment",
  },
  {
    pattern: /Comment must be \d+ characters or less/i,
    message: "Your comment is too long. Please shorten it.",
    field: "comment",
  },
  {
    pattern: /Comments can only be edited within 15 minutes/i,
    message: "Comments can only be edited within 15 minutes of posting.",
  },
  {
    pattern: /Maximum reply depth reached/i,
    message: "You cannot reply to this comment. Maximum nesting level reached.",
  },
  {
    pattern: /Parent comment not found/i,
    message: "The comment you're replying to no longer exists.",
  },
  {
    pattern: /You can only edit your own comments/i,
    message: "You can only edit your own comments.",
  },
  {
    pattern: /You can only delete your own comments/i,
    message: "You can only delete your own comments.",
  },

  // Design/Creation errors
  {
    pattern: /At least one image is required/i,
    message: "Please upload at least one image for your design.",
    field: "images",
  },
  {
    pattern: /Maximum 5 images allowed/i,
    message: "You can upload a maximum of 5 images per design.",
    field: "images",
  },
  {
    pattern: /Invalid image reference/i,
    message: "One or more images failed to upload. Please try again.",
    field: "images",
  },
  {
    pattern: /Creation not found/i,
    message: "This design could not be found. It may have been removed.",
  },
  {
    pattern: /Design not found/i,
    message: "This design could not be found. It may have been removed.",
  },

  // Social connections
  {
    pattern: /already connected to another account/i,
    message: "This account is already connected to a different GearForge profile.",
  },
  {
    pattern: /No \w+ connection found/i,
    message: "No connection found for this platform.",
  },

  // Follow errors
  {
    pattern: /Cannot follow yourself/i,
    message: "You cannot follow yourself.",
  },

  // Report errors
  {
    pattern: /You have already reported this design/i,
    message: "You have already reported this design. Our team will review it.",
  },
  {
    pattern: /Report has already been reviewed/i,
    message: "This report has already been reviewed.",
  },

  // Rate limiting
  {
    pattern: /Rate limit exceeded/i,
    message: "You're doing that too often. Please wait a moment and try again.",
  },
  {
    pattern: /Too many requests/i,
    message: "You're doing that too often. Please wait a moment and try again.",
  },
  {
    pattern: /Please wait .* before/i,
    message: "Please wait a moment before trying again.",
  },

  // Account deletion
  {
    pattern: /Battle\.net tag does not match/i,
    message: "The Battle.net tag you entered doesn't match. Please enter your exact tag to confirm deletion.",
    field: "confirmBattleTag",
  },

  // Badge errors
  {
    pattern: /User already has this badge/i,
    message: "This user already has this badge.",
  },

  // Strike errors
  {
    pattern: /Cannot issue strikes to moderators/i,
    message: "Cannot issue strikes to moderators.",
  },
  {
    pattern: /This strike cannot be appealed/i,
    message: "This strike cannot be appealed.",
  },
  {
    pattern: /This strike is not under appeal/i,
    message: "This strike is not currently under appeal.",
  },

  // Collection errors
  {
    pattern: /Collection not found/i,
    message: "This collection could not be found.",
  },
  {
    pattern: /You can only (edit|delete|add items to|remove items from) your own collections/i,
    message: "You can only modify your own collections.",
  },

  // Admin errors
  {
    pattern: /Cannot ban an admin user/i,
    message: "Admin users cannot be banned.",
  },
  {
    pattern: /User is already banned/i,
    message: "This user is already banned.",
  },
  {
    pattern: /User is not banned/i,
    message: "This user is not currently banned.",
  },
  {
    pattern: /Cannot change your own role/i,
    message: "You cannot change your own role.",
  },
  {
    pattern: /User already has role/i,
    message: "This user already has the selected role.",
  },
  {
    pattern: /Creation is already hidden/i,
    message: "This design is already hidden.",
  },
  {
    pattern: /Creation is already published/i,
    message: "This design is already published.",
  },

  // Generic not found
  {
    pattern: /User not found/i,
    message: "User not found.",
  },
  {
    pattern: /Comment not found/i,
    message: "This comment could not be found.",
  },
  {
    pattern: /Notification not found/i,
    message: "This notification could not be found.",
  },
  {
    pattern: /Strike not found/i,
    message: "This strike record could not be found.",
  },
  {
    pattern: /Connection not found/i,
    message: "This connection could not be found.",
  },
];

/**
 * Parses a Convex error and returns a user-friendly message.
 * @param error - The error from a Convex mutation/query
 * @returns An object with the user-friendly message and optional field name
 */
export function parseConvexError(error: unknown): {
  message: string;
  field?: string;
} {
  // Extract error message from various error types
  let errorMessage = "An unexpected error occurred. Please try again.";

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object" && "message" in error) {
    errorMessage = String((error as { message: unknown }).message);
  }

  // Strip common Convex error prefixes
  errorMessage = errorMessage
    .replace(/^\[CONVEX [A-Z]\([^)]+\)\]\s*/, "") // Remove [CONVEX M(...)] prefix
    .replace(/^\[Request ID: [a-f0-9]+\]\s*/, "") // Remove request ID
    .replace(/^Server Error\s*/, "") // Remove "Server Error" prefix
    .replace(/^Uncaught Error:\s*/, "") // Remove "Uncaught Error:" prefix
    .trim();

  // Find matching pattern
  for (const { pattern, message, field } of errorPatterns) {
    if (typeof pattern === "string") {
      if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
        return { message, field };
      }
    } else if (pattern.test(errorMessage)) {
      return { message, field };
    }
  }

  // If no pattern matched but we have a cleaned error message, return it
  // But sanitize it to remove stack traces
  if (errorMessage && !errorMessage.includes("at handler")) {
    return { message: errorMessage };
  }

  // Default fallback
  return {
    message: "Something went wrong. Please try again or contact support if the problem persists.",
  };
}

/**
 * Helper to get just the user-friendly message string
 */
export function getErrorMessage(error: unknown): string {
  return parseConvexError(error).message;
}

/**
 * Type guard to check if an error is a specific type
 */
export function isSessionExpiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /session|expired|log in|unauthorized/i.test(message);
}

/**
 * Type guard for rate limit errors
 */
export function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /rate limit|too many|please wait/i.test(message);
}
