import type { AuthConfig } from "convex/server"

const firebaseProjectId = "wellcare-medicose"

// Production Firebase JWT provider for the Wellcare Medicose Convex deployment.
export default {
  providers: [
    {
      type: "customJwt",
      applicationID: firebaseProjectId,
      issuer: `https://securetoken.google.com/${firebaseProjectId}`,
      jwks: "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig
