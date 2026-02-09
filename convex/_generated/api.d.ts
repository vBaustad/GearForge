/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as collections from "../collections.js";
import type * as creations from "../creations.js";
import type * as follows from "../follows.js";
import type * as gameData from "../gameData.js";
import type * as http from "../http.js";
import type * as likes from "../likes.js";
import type * as rateLimit from "../rateLimit.js";
import type * as reports from "../reports.js";
import type * as saves from "../saves.js";
import type * as seed from "../seed.js";
import type * as socialConnections from "../socialConnections.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  collections: typeof collections;
  creations: typeof creations;
  follows: typeof follows;
  gameData: typeof gameData;
  http: typeof http;
  likes: typeof likes;
  rateLimit: typeof rateLimit;
  reports: typeof reports;
  saves: typeof saves;
  seed: typeof seed;
  socialConnections: typeof socialConnections;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
