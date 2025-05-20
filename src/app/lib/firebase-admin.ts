// src/lib/firebase-admin.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let messaging: admin.messaging.Messaging | undefined;

function initializeFirebaseApp() {
  if (admin.apps.length > 0) {
    messaging = admin.messaging();
    console.log('Firebase Admin SDK already initialized');
    return;
  }

  try {
    let serviceAccount: any;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('Loaded service account from environment variable');
      } catch (error) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', error);
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON format');
      }
    } else {
      const serviceAccountPath = resolve(process.cwd(), 'firebase-service-account.json');
      try {
        serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        console.log(`Loaded service account from file: ${serviceAccountPath}`);
      } catch (error) {
        console.error(`Error reading service account file at ${serviceAccountPath}:`, error);
        throw new Error(`Failed to read firebase-service-account.json`);
      }
    }

    // Validate service account
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      console.error('Service account JSON:', JSON.stringify(serviceAccount, null, 2));
      throw new Error('Service account JSON is missing required fields (project_id, private_key, client_email)');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    messaging = admin.messaging();
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

// Initialize on module load
try {
  initializeFirebaseApp();
} catch (error) {
  console.error('Initialization failed at module level:', error);
}

export { messaging };