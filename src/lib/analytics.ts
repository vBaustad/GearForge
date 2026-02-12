import { track } from "@vercel/analytics";

/**
 * Custom analytics events for GearForge.
 * These are tracked in Vercel Analytics dashboard.
 */

// Design events
export function trackDesignView(designId: string, category: string) {
  track("design_view", { designId, category });
}

export function trackDesignLike(designId: string) {
  track("design_like", { designId });
}

export function trackDesignSave(designId: string) {
  track("design_save", { designId });
}

export function trackImportStringCopy(designId: string) {
  track("import_string_copy", { designId });
}

// Upload events
export function trackUploadStart() {
  track("upload_start");
}

export function trackUploadComplete(designId: string, category: string) {
  track("upload_complete", { designId, category });
}

// Search events
export function trackSearch(query: string, resultCount: number) {
  track("search", { query, resultCount });
}

export function trackCategoryFilter(category: string) {
  track("category_filter", { category });
}

// Social events
export function trackShare(platform: string, designId: string) {
  track("share", { platform, designId });
}

export function trackFollow(followedUserId: string) {
  track("follow", { followedUserId });
}

export function trackSocialConnect(platform: string) {
  track("social_connect", { platform });
}

// Auth events
export function trackLogin() {
  track("login");
}

export function trackLogout() {
  track("logout");
}

// Shopping list events
export function trackAddToShoppingList(designId: string, itemCount: number) {
  track("add_to_shopping_list", { designId, itemCount });
}

// Comment events
export function trackComment(designId: string) {
  track("comment", { designId });
}
