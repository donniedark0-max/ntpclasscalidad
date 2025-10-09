import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let appInstance!: FirebaseApp;
if (!getApps().length) {
    console.log('Firebase: initializing app with config', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
    });
    appInstance = initializeApp(firebaseConfig as any);
    console.log('Firebase: app initialized successfully');
} else {
    appInstance = getApps()[0];
    console.log('Firebase: app already initialized');
}

export function getFirebaseAuth() {
    console.log('Firebase: retrieving auth instance');
    const auth = getAuth(appInstance as any);
    console.log('Firebase: auth instance ready');
    return auth;
}

export default appInstance;
