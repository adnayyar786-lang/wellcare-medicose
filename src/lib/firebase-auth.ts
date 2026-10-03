export type FirebaseUserLike = {
  uid: string
  email?: string | null
  phoneNumber?: string | null
  displayName?: string | null
  photoURL?: string | null
  getIdToken: (forceRefresh?: boolean) => Promise<string>
}

declare global {
  interface Window {
    firebase?: any
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wellcare-medicose.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wellcare-medicose',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function getFirebaseAuth(): any {
  if (typeof window === 'undefined') return null
  const firebase = window.firebase
  if (!firebase) throw new Error('Firebase SDK has not loaded yet.')
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig)
  return firebase.auth()
}

export function getFirebaseUser(): FirebaseUserLike | null {
  try {
    return getFirebaseAuth()?.currentUser ?? null
  } catch {
    return null
  }
}

export async function signInWithGoogleFirebase(): Promise<FirebaseUserLike> {
  const auth = getFirebaseAuth()
  const provider = new window.firebase.auth.GoogleAuthProvider()
  const result = await auth.signInWithPopup(provider)
  return result.user as FirebaseUserLike
}

export async function sendFirebasePhoneCode(
  phoneNumber: string,
  containerId: string,
): Promise<any> {
  const auth = getFirebaseAuth()
  const existing = (window as any).__wellcareRecaptcha
  if (existing) {
    try { existing.clear() } catch {}
  }
  const verifier = new window.firebase.auth.RecaptchaVerifier(
    containerId,
    { size: 'invisible' },
    auth,
  )
  ;(window as any).__wellcareRecaptcha = verifier
  return await auth.signInWithPhoneNumber(phoneNumber, verifier)
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth()
  if (auth) await auth.signOut()
}
