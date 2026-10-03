import type { AuthConfig } from "convex/server"

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "wellcare-medicose"

export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
    {
      domain: `https://securetoken.google.com/${firebaseProjectId}`,
      applicationID: firebaseProjectId,
    },
  ],
} satisfies AuthConfig
