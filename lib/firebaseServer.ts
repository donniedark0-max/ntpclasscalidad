import admin from 'firebase-admin';

let app: admin.app.App;

function initFirebaseAdmin() {
  if (admin.apps && admin.apps.length) {
    app = admin.apps[0]!;
    return app;
  }

  // Use service account from environment variable if provided
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  let credential: admin.credential.Credential;

  if (serviceAccountJson) {
    try {
      const obj = JSON.parse(serviceAccountJson);
      credential = admin.credential.cert(obj as admin.ServiceAccount);
    } catch (err) {
      console.warn('FIREBASE_SERVICE_ACCOUNT is not valid JSON, falling back to application default credentials');
      credential = admin.credential.applicationDefault();
    }
  } else {
    credential = admin.credential.applicationDefault();
  }

  app = admin.initializeApp({
    credential,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

  return app;
}

export function getFirestore() {
  if (!app) initFirebaseAdmin();
  return admin.firestore();
}

export default initFirebaseAdmin;
