// Public Firebase web-app configuration. The VITE_* values are still accepted,
// but these exact project values keep the customer auth flow working even when
// Cloudflare's build environment does not inject the variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDVASii63wOfZLw4L0z-TMwJU84SjKmvjK',
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
  if (!firebase) throw new Error('Firebase SDK has not loaded yet.')
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig)
  return firebase.auth()
}
export async function signInWithGoogleFirebase(): Promise<FirebaseUserLike> {
  const auth=getFirebaseAuth(), firebase=(window as any).firebase
  const provider=new firebase.auth.GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  if(isMobile){
    await auth.signInWithRedirect(provider)
    throw new Error('Redirecting to Google sign-in…')
  }
  try {
    return (await auth.signInWithPopup(provider)).user as FirebaseUserLike
  } catch (error:any) {
    const code=error?.code || ''
    if(code==='auth/popup-blocked' || code==='auth/popup-closed-by-user' || code==='auth/cancelled-popup-request'){
      await auth.signInWithRedirect(provider)
      throw new Error('Redirecting to Google sign-in…')
    }
    throw error
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
  const oldVerifier=(window as any).__wellcareRecaptcha
  if(oldVerifier){try{oldVerifier.clear()}catch{}}
  const verifier=new firebase.auth.RecaptchaVerifier(buttonId,{size:'invisible'},auth)
  ;(window as any).__wellcareRecaptcha=verifier
  try {
    return await auth.signInWithPhoneNumber(phoneNumber,verifier)
  } catch (error) {
    try { verifier.clear() } catch {}
    ;(window as any).__wellcareRecaptcha=null
    throw error
  }
}
export async function signOutFirebase(){ const auth=getFirebaseAuth(); if(auth) await auth.signOut() }
