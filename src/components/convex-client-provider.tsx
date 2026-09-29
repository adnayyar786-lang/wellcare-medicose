import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

const CONVEX_URL =
  (import.meta as any).env.VITE_CONVEX_URL ||
  "https://impartial-reindeer-344.eu-west-1.convex.cloud";

const convex = new ConvexReactClient(CONVEX_URL);

export default function AppConvexProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexAuthProvider client={convex}>
      {children}
    </ConvexAuthProvider>
  );
}
