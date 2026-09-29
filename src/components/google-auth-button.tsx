import { useAuthActions } from "@convex-dev/auth/react"
import { Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type GoogleAuthButtonProps = {
  premium?: boolean
}

export function GoogleAuthButton({
  premium = false,
}: GoogleAuthButtonProps) {
  const { signIn } = useAuthActions()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      await signIn("google")
    } catch (caught) {
      console.error("Google sign-in failed:", caught)

      setError(
        caught instanceof Error
          ? caught.message
          : "Google sign-in failed. Please try again.",
      )

      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Button
        type="button"
        variant={premium ? "default" : "outline"}
        className="w-full"
        onClick={() => void handleGoogleSignIn()}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M21.35 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.42Z"
              />
              <path
                fill="#34A853"
                d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z"
              />
              <path
                fill="#FBBC05"
                d="M6.54 13.59A5.86 5.86 0 0 1 6.23 12c0-.55.11-1.09.31-1.59V7.88H3.3A9.5 9.5 0 0 0 2.25 12c0 1.53.37 2.98 1.05 4.12l3.24-2.53Z"
              />
              <path
                fill="#EA4335"
                d="M12 6.38c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.4 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 8.1 9.46 6.38 12 6.38Z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </Button>

      {error ? (
        <p className="mt-2 text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
