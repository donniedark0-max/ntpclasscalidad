// This module avoids importing firebase/* at top-level so it isn't bundled on the server.
// Provide async getters which dynamically import firebase packages at runtime (client only).

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let appInstance: any = null;

export async function getFirebaseApp() {
    // Only initialize on client
    if (typeof window === 'undefined') return null;
    if (appInstance) return appInstance;
    const firebase = await import('firebase/app');
    const { initializeApp, getApps } = firebase;
    if (!getApps().length) {
        // initialize with client config
        appInstance = initializeApp(firebaseConfig as any);
    } else {
        appInstance = getApps()[0];
    }
    return appInstance;
}

export async function getFirebaseAuth() {
    const app = await getFirebaseApp();
    if (!app) throw new Error('Firebase client not available');
    const { getAuth } = await import('firebase/auth');
    return getAuth(app as any);
}

export async function getFirebaseStorage() {
    const app = await getFirebaseApp();
    if (!app) throw new Error('Firebase client not available');
    const mod = await import('firebase/storage');
    return mod; // caller can use mod.getStorage(app)
}

export async function getFirebaseFirestore() {
    const app = await getFirebaseApp();
    if (!app) throw new Error('Firebase client not available');
    const mod = await import('firebase/firestore');
    return mod;
}

export default getFirebaseApp;
