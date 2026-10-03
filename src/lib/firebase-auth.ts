const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wellcare-medicose.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wellcare-medicose',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
  const auth=getFirebaseAuth(), provider=new (window as any).firebase.auth.GoogleAuthProvider()
  return (await auth.signInWithPopup(provider)).user as FirebaseUserLike
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
export async function sendFirebasePhoneCode(phoneNumber:string,containerId:string):Promise<any>{
  const auth=getFirebaseAuth(), oldVerifier=(window as any).__wellcareRecaptcha
  if(oldVerifier){try{oldVerifier.clear()}catch{}}
  const verifier=new (window as any).firebase.auth.RecaptchaVerifier(containerId,{size:'invisible'},auth)
  ;(window as any).__wellcareRecaptcha=verifier
  return auth.signInWithPhoneNumber(phoneNumber,verifier)
}
export async function signOutFirebase(){ const auth=getFirebaseAuth(); if(auth) await auth.signOut() }
