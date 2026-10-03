import type { AuthConfig } from "convex/server"

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "wellcare-medicose"

export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
    {
      type: "customJwt",
      applicationID: firebaseProjectId,
      issuer: `https://securetoken.google.com/${firebaseProjectId}`,
      jwks: "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig
