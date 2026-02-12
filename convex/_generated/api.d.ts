/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auditLog from "../auditLog.js";
import type * as auth from "../auth.js";
import type * as badges from "../badges.js";
import type * as blog from "../blog.js";
import type * as changelog from "../changelog.js";
import type * as collections from "../collections.js";
import type * as comments from "../comments.js";
import type * as creations from "../creations.js";
import type * as follows from "../follows.js";
import type * as gameData from "../gameData.js";
import type * as http from "../http.js";
import type * as likes from "../likes.js";
import type * as moderation from "../moderation.js";
import type * as notifications from "../notifications.js";
import type * as rateLimit from "../rateLimit.js";
import type * as reports from "../reports.js";
import type * as roomBundles from "../roomBundles.js";
import type * as saves from "../saves.js";
import type * as securityMonitor from "../securityMonitor.js";
import type * as seed from "../seed.js";
import type * as shoppingList from "../shoppingList.js";
import type * as socialConnections from "../socialConnections.js";
import type * as strikes from "../strikes.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auditLog: typeof auditLog;
  auth: typeof auth;
  badges: typeof badges;
  blog: typeof blog;
  changelog: typeof changelog;
  collections: typeof collections;
  comments: typeof comments;
  creations: typeof creations;
  follows: typeof follows;
  gameData: typeof gameData;
  http: typeof http;
  likes: typeof likes;
  moderation: typeof moderation;
  notifications: typeof notifications;
  rateLimit: typeof rateLimit;
  reports: typeof reports;
  roomBundles: typeof roomBundles;
  saves: typeof saves;
  securityMonitor: typeof securityMonitor;
  seed: typeof seed;
  shoppingList: typeof shoppingList;
  socialConnections: typeof socialConnections;
  strikes: typeof strikes;
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
