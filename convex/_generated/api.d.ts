/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as GameStateWithDb from "../GameStateWithDb.js";
import type * as PlayerWithDb from "../PlayerWithDb.js";
import type * as kbGame from "../kbGame.js";
import type * as utils_ai from "../utils/ai.js";
import type * as utils_auth from "../utils/auth.js";
import type * as utils_ctx from "../utils/ctx.js";
import type * as utils_kbGame from "../utils/kbGame.js";
import type * as utils_types from "../utils/types.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  GameStateWithDb: typeof GameStateWithDb;
  PlayerWithDb: typeof PlayerWithDb;
  kbGame: typeof kbGame;
  "utils/ai": typeof utils_ai;
  "utils/auth": typeof utils_auth;
  "utils/ctx": typeof utils_ctx;
  "utils/kbGame": typeof utils_kbGame;
  "utils/types": typeof utils_types;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
