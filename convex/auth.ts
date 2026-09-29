import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "./ResendOTP";
import { PhoneOTP } from "./PhoneOTP";
import { createProviderUser } from "./authUsers";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [ResendOTP, PhoneOTP, Google],
  callbacks: { createOrUpdateUser: createProviderUser },
  session: { totalDurationMs: 1000 * 60 * 60 * 24 * 30 },
});
