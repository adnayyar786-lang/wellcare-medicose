// Firebase web-app configuration. Firebase Web API keys are public-by-design;
// use the Cloudflare VITE_* value when present, with the current Firebase Web App key
// as the production-safe fallback so a missing Workers build variable cannot
// turn customer authentication into auth/invalid-api-key.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDVASii63wOfZLw4L0z-TMwJU84SjKmvJk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wellcare-medicose.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wellcare-medicose',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'wellcare-medicose.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '927291380187',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:927291380187:web:88f2fdbd47a009979197fe',
}

export type FirebaseUserLike = { uid:string; email?:string|null; phoneNumber?:string|null; displayName?:string|null; photoURL?:string|null; getIdToken:(forceRefresh?:boolean)=>Promise<string> }

export function getFirebaseAuth(): any {
  if (typeof window === 'undefined') return null
  const firebase = (window as any).firebase
  if (!firebase) throw new Error('Firebase is still loading. Please wait a moment and try again.')
  const appName = 'wellcare-customer'
  let app = firebase.apps.find((item: any) => item.name === appName)
  if (!app) app = firebase.initializeApp(firebaseConfig, appName)
  return app.auth()
}
export async function signInWithGoogleFirebase(): Promise<FirebaseUserLike> {
  const auth=getFirebaseAuth(), firebase=(window as any).firebase
  const provider=new firebase.auth.GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  // Keep the Google session on this exact Cloudflare origin. The previous
  // mobile redirect flow could return to the login screen when browser
  // storage/redirect handling was interrupted. Firebase recommends popup
  // sign-in as the alternative for this hosting setup.
  try {
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    const result = await auth.signInWithPopup(provider)
    if (!result?.user) throw new Error('Google sign-in completed but no Firebase user was returned.')
    return result.user as FirebaseUserLike
  } catch (error:any) {
    const code=error?.code || ''
    const message=error?.message || ''
    if(code==='auth/popup-blocked') {
      throw new Error('Google sign-in popup was blocked. Please allow popups for this website and try again.')
    }
    if(code==='auth/account-exists-with-different-credential') {
      throw new Error('This Gmail already has a Wellcare account with another sign-in method. Sign in with that method first, then use Google.')
    }
    if(code==='auth/unauthorized-domain') {
      throw new Error('This website domain is not authorized in Firebase Authentication.')
    }
    if(code==='auth/operation-not-allowed') {
      throw new Error('Google sign-in is not enabled in Firebase Authentication.')
    }
    throw new Error(message || 'Google sign-in failed. Please try again.')
  }
}
export async function signInWithEmailFirebase(email:string,password:string):Promise<FirebaseUserLike>{
  return (await getFirebaseAuth().signInWithEmailAndPassword(email.trim().toLowerCase(),password)).user as FirebaseUserLike
}
export async function createAccountWithEmailFirebase(email:string,password:string,displayName?:string):Promise<FirebaseUserLike>{
  const result=await getFirebaseAuth().createUserWithEmailAndPassword(email.trim().toLowerCase(),password)
  if(displayName?.trim()) await result.user.updateProfile({displayName:displayName.trim()})
  return result.user as FirebaseUserLike
}
export async function sendPasswordResetFirebase(email:string){ await getFirebaseAuth().sendPasswordResetEmail(email.trim().toLowerCase()) }
export async function sendFirebasePhoneCode(phoneNumber:string,buttonId:string):Promise<any>{
  const auth=getFirebaseAuth(), firebase=(window as any).firebase
  if(!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
    throw new Error('Enter a valid mobile number with country code, for example +919876543210.')
  }
  const oldVerifier=(window as any).__wellcareRecaptcha
  if(oldVerifier){try{oldVerifier.clear()}catch{}}
  // Firebase compat RecaptchaVerifier takes the button/container ID as its first
  // argument; the Auth instance is obtained from the same Firebase app.
  const verifier=new firebase.auth.RecaptchaVerifier(buttonId,{size:'invisible'},auth.app)
  ;(window as any).__wellcareRecaptcha=verifier
  try { return await auth.signInWithPhoneNumber(phoneNumber,verifier) }
  catch (error) { try { verifier.clear() } catch {}; (window as any).__wellcareRecaptcha=null; throw error }
}
export async function signOutFirebase(){ const auth=getFirebaseAuth(); if(auth) await auth.signOut() }
