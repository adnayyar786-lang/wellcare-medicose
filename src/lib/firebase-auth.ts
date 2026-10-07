// Single Firebase Authentication configuration for the customer website.
// Do not allow a stale Cloudflare VITE_* variable to silently switch the app
// to another Firebase project. The values below belong to wellcare-medicose.
const firebaseConfig = {
  apiKey: 'AIzaSyDVASii63wOfZLw4L0z-TMwJU84SjKmvJk',
  authDomain: 'wellcare-medicose.firebaseapp.com',
  projectId: 'wellcare-medicose',
  storageBucket: 'wellcare-medicose.firebasestorage.app',
  messagingSenderId: '927291380187',
  appId: '1:927291380187:web:88f2fdbd47a009979197fe',
}

export type FirebaseUserLike = {
  uid:string
  email?:string|null
  phoneNumber?:string|null
  displayName?:string|null
  photoURL?:string|null
  getIdToken:(forceRefresh?:boolean)=>Promise<string>
}

export function getFirebaseAuth(): any {
  if (typeof window === 'undefined') return null
  const firebase = (window as any).firebase
  if (!firebase) throw new Error('Firebase is still loading. Please wait a moment and try again.')
  const appName = 'wellcare-customer'
  let app = firebase.apps.find((item: any) => item.name === appName)
  if (!app) app = firebase.initializeApp(firebaseConfig, appName)
  return app.auth()
}

async function confirmFirebaseSession(user: any): Promise<FirebaseUserLike> {
  if (!user) throw new Error('Firebase did not return a signed-in user.')
  await user.getIdToken(true)
  return user as FirebaseUserLike
}

export async function signInWithGoogleFirebase(): Promise<FirebaseUserLike> {
  const productionHost = 'wellcare-medicose.adnayyar786.workers.dev'
  if (window.location.hostname !== productionHost) {
    const target = new URL(window.location.href)
    target.hostname = productionHost
    window.location.replace(target.toString())
    return await new Promise<FirebaseUserLike>(() => {})
  }

  const auth = getFirebaseAuth()
  const firebase = (window as any).firebase
  const provider = new firebase.auth.GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  try {
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)

    // The customer site is hosted on Cloudflare while Firebase owns the
    // authentication project. Prefer popup so Google completes the OAuth
    // exchange in the same browser context instead of returning through a
    // cross-origin Firebase redirect helper.
    let result: any
    try {
      result = await auth.signInWithPopup(provider)
    } catch (firstError:any) {
      const firstCode = firstError?.code || ''
      if (
        firstCode === 'auth/invalid-credential' ||
        firstCode === 'auth/invalid-idp-response'
      ) {
        try { await auth.signOut() } catch {}
        result = await auth.signInWithPopup(provider)
      } else if (
        firstCode === 'auth/popup-blocked' ||
        firstCode === 'auth/popup-closed-by-user'
      ) {
        // Only fall back to redirect when the browser explicitly prevents
        // the popup. Normal Android/Chrome sign-in stays on the app origin.
        await auth.signInWithRedirect(provider)
        return await new Promise<FirebaseUserLike>(() => {})
      } else {
        throw firstError
      }
    }

    if (!result?.user) {
      throw new Error('Google sign-in completed but no Firebase user was returned.')
    }
    return await confirmFirebaseSession(result.user)
  } catch (error:any) {
    const code = error?.code || ''
    const message = error?.message || ''

    if (code === 'auth/popup-blocked') {
      throw new Error('Google sign-in popup was blocked. Please allow popups for this website and try again.')
    }
    if (code === 'auth/invalid-credential' || code === 'auth/invalid-idp-response') {
      throw new Error('Google/Firebase rejected the OAuth credential. The Firebase Google provider and its Web OAuth client must match the wellcare-medicose project.')
    }
    if (code === 'auth/account-exists-with-different-credential') {
      throw new Error('This Gmail already has a Wellcare account with another sign-in method. Sign in with that method first.')
    }
    if (code === 'auth/unauthorized-domain') {
      throw new Error('This website domain is not authorized in Firebase Authentication.')
    }
    if (code === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in is not enabled in Firebase Authentication.')
    }
    throw new Error(message || 'Google sign-in failed. Please try again.')
  }
}

export async function signInWithEmailFirebase(email:string,password:string):Promise<FirebaseUserLike>{
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !password) throw new Error('Enter your email address and password.')
  try {
    const result = await getFirebaseAuth().signInWithEmailAndPassword(normalizedEmail,password)
    return await confirmFirebaseSession(result.user)
  } catch (error:any) {
    const code = error?.code || ''
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      throw new Error('Email sign-in failed. If you originally created this Wellcare account with Google, use Google Sign-In first and then set an email password from My Account. Otherwise use Forgot password to create a new password.')
    }
    if (code === 'auth/too-many-requests') {
      throw new Error('Too many sign-in attempts. Please wait a little and try again.')
    }
    if (code === 'auth/user-disabled') {
      throw new Error('This Wellcare account is disabled. Please contact support.')
    }
    if (code === 'auth/operation-not-allowed') {
      throw new Error('Email/password sign-in is currently disabled in Firebase. Please contact Wellcare support.')
    }
    throw error
  }
}

export async function setEmailPasswordFirebase(
  email:string,
  password:string,
  confirmPassword:string,
):Promise<FirebaseUserLike>{
  const auth = getFirebaseAuth()
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('Please sign in to your Wellcare account first.')
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) throw new Error('Enter your account email address.')
  if (currentUser.email?.trim().toLowerCase() !== normalizedEmail) {
    throw new Error('Use the same email address as your signed-in Wellcare account.')
  }
  if (password.length < 6) throw new Error('Password must be at least 6 characters.')
  if (password !== confirmPassword) throw new Error('Passwords do not match.')

  const firebase = (window as any).firebase
  const credential = firebase.auth.EmailAuthProvider.credential(normalizedEmail,password)
  try {
    const providers = currentUser.providerData || []
    const passwordLinked = providers.some((item:any) => item?.providerId === 'password')
    let updatedUser:any
    if (passwordLinked) {
      await currentUser.updatePassword(password)
      updatedUser = currentUser
    } else {
      const result = await currentUser.linkWithCredential(credential)
      updatedUser = result.user
    }
    return await confirmFirebaseSession(updatedUser)
  } catch (error:any) {
    const code = error?.code || ''
    if (code === 'auth/provider-already-linked') {
      await currentUser.updatePassword(password)
      return await confirmFirebaseSession(currentUser)
    }
    if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
      throw new Error('This email/password credential is already attached to another Wellcare account. Sign in to that account instead.')
    }
    if (code === 'auth/requires-recent-login') {
      throw new Error('For security, please sign in again and then set the email password.')
    }
    if (code === 'auth/weak-password') {
      throw new Error('Choose a stronger password with at least 6 characters.')
    }
    throw error
  }
}

export async function createAccountWithEmailFirebase(email:string,password:string,displayName?:string):Promise<FirebaseUserLike>{
  const result = await getFirebaseAuth().createUserWithEmailAndPassword(email.trim().toLowerCase(),password)
  if(displayName?.trim()) await result.user.updateProfile({displayName:displayName.trim()})
  return await confirmFirebaseSession(result.user)
}

export async function sendPasswordResetFirebase(email:string){
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) throw new Error('Enter your email address first.')
  try {
    await getFirebaseAuth().sendPasswordResetEmail(normalizedEmail)
  } catch (error:any) {
    const code = error?.code || ''
    if (code === 'auth/invalid-email') throw new Error('Enter a valid email address.')
    if (code === 'auth/too-many-requests') throw new Error('Too many reset requests. Please wait a little and try again.')
    throw error
  }
}

export async function sendFirebasePhoneCode(phoneNumber:string,buttonId:string):Promise<any>{
  const auth = getFirebaseAuth()
  const firebase = (window as any).firebase

  if(!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
    throw new Error('Enter a valid mobile number with country code, for example +919876543210.')
  }

  const oldVerifier = (window as any).__wellcareRecaptcha
  if(oldVerifier){try{oldVerifier.clear()}catch{}}

  const verifier = new firebase.auth.RecaptchaVerifier(
    buttonId,
    {size:'invisible'},
    auth.app,
  )
  ;(window as any).__wellcareRecaptcha = verifier

  try {
    return await auth.signInWithPhoneNumber(phoneNumber, verifier)
  } catch (error:any) {
    try { verifier.clear() } catch {}
    ;(window as any).__wellcareRecaptcha = null

    const code = error?.code || ''
    if (code === 'auth/invalid-phone-number') {
      throw new Error('That mobile number is not valid. Check the country code and number.')
    }
    if (code === 'auth/operation-not-allowed') {
      throw new Error('Phone sign-in is not enabled in Firebase Authentication.')
    }
    if (code === 'auth/captcha-check-failed') {
      throw new Error('Phone verification could not complete the security check. Please try again.')
    }
    throw error
  }
}

export async function signOutFirebase(){
  const auth = getFirebaseAuth()
  if(auth) await auth.signOut()
}
