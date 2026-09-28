/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as MacalyGoogle from "../MacalyGoogle.js";
import type * as PhoneOTP from "../PhoneOTP.js";
import type * as ResendOTP from "../ResendOTP.js";
import type * as activity from "../activity.js";
import type * as appFiles from "../appFiles.js";
import type * as auth from "../auth.js";
import type * as authUsers from "../authUsers.js";
import type * as coupons from "../coupons.js";
import type * as customers from "../customers.js";
import type * as emails from "../emails.js";
import type * as googleAuth from "../googleAuth.js";
import type * as http from "../http.js";
import type * as macaly from "../macaly.js";
import type * as medicines from "../medicines.js";
import type * as orders from "../orders.js";
import type * as profile from "../profile.js";
import type * as settings from "../settings.js";
import type * as shops from "../shops.js";
import type * as staff from "../staff.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  MacalyGoogle: typeof MacalyGoogle;
  PhoneOTP: typeof PhoneOTP;
  ResendOTP: typeof ResendOTP;
  activity: typeof activity;
  appFiles: typeof appFiles;
  auth: typeof auth;
  authUsers: typeof authUsers;
  coupons: typeof coupons;
  customers: typeof customers;
  emails: typeof emails;
  googleAuth: typeof googleAuth;
  http: typeof http;
  macaly: typeof macaly;
  medicines: typeof medicines;
  orders: typeof orders;
  profile: typeof profile;
  settings: typeof settings;
  shops: typeof shops;
  staff: typeof staff;
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
