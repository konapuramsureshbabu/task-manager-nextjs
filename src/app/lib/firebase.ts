// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key as keyof typeof firebaseConfig]);
if (missingKeys.length) {
  console.error(`Missing Firebase config keys: ${missingKeys.join(', ')}`);
  throw new Error('Invalid Firebase configuration');
}

let messaging: Messaging | undefined;
try {
  const app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (error: unknown) {
  console.error('Error initializing Firebase:', error);
}

export { messaging, getToken, onMessage };