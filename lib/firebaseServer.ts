import admin from 'firebase-admin';

let app: admin.app.App;

function initFirebaseAdmin() {
  if (admin.apps && admin.apps.length) {
    app = admin.apps[0]!;
    return app;
  }
  const fs = require('fs')
  const path = require('path')

  // 1) prefer utp-class-fsc.json in repo root
  try {
    const rootSa = path.resolve(process.cwd(), 'utp-class-fsc.json')
    if (fs.existsSync(rootSa)) {
      const obj = JSON.parse(fs.readFileSync(rootSa, 'utf8'))
      app = admin.initializeApp({ credential: admin.credential.cert(obj as admin.ServiceAccount), projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID })
      return app
    }
  } catch (e: any) {
    console.warn('Failed to init admin from utp-class-fsc.json', e?.message || e)
  }

  // 2) Try FIREBASE_SERVICE_ACCOUNT env var (string JSON or path)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      let obj: any
      // If it's a path
      if (fs.existsSync(serviceAccountJson)) {
        obj = JSON.parse(fs.readFileSync(serviceAccountJson, 'utf8'))
      } else {
        obj = JSON.parse(serviceAccountJson)
      }
      app = admin.initializeApp({ credential: admin.credential.cert(obj as admin.ServiceAccount), projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID })
      return app
    } catch (err: any) {
      console.log('FIREBASE_SERVICE_ACCOUNT provided but invalid JSON; firebase-admin not initialized')
    }
  }

  // 3) allow ADC via GOOGLE_APPLICATION_CREDENTIALS or environment (less preferred but fallback)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      app = admin.initializeApp()
      return app
    } catch (e: any) {
      console.log('Failed to initialize admin via ADC', e?.message || e)
    }
  }

  return undefined as any
}

export function getFirestore() {
  if (!app) {
    initFirebaseAdmin();
    if (!app) return undefined as any
  }
  return admin.firestore();
}

export default initFirebaseAdmin;
