import type { Id } from "../../convex/_generated/dataModel";

export type Category =
  | "bedroom"
  | "living_room"
  | "kitchen"
  | "garden"
  | "tavern"
  | "throne_room"
  | "workshop"
  | "library"
  | "exterior"
  | "other";

export interface Creation {
  _id: Id<"creations">;
  title: string;
  description?: string;
  importString: string;
  imageIds: Id<"_storage">[];
  thumbnailId?: Id<"_storage">;
  category: Category;
  tags: string[];
  items: { decorId: number; quantity: number }[];
  creatorId: Id<"users">;
  createdAt: number;
  updatedAt: number;
  likeCount: number;
  viewCount: number;
  status: "published" | "hidden" | "deleted";
}

export interface CreationWithCreator extends Creation {
  creatorName: string;
  thumbnailUrl: string | null;
}

export interface CreationDetail extends Creation {
  creatorName: string;
  imageUrls: string[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  bedroom: "Bedroom",
  living_room: "Living Room",
  kitchen: "Kitchen",
  garden: "Garden",
  tavern: "Tavern",
  throne_room: "Throne Room",
  workshop: "Workshop",
  library: "Library",
  exterior: "Exterior",
  other: "Other",
};

export const CATEGORIES: Category[] = [
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
];
