import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK for server-side operations
// This is used for generating custom tokens and other admin operations

const serviceAccount: ServiceAccount | null = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

function initializeFirebaseAdmin() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // If service account is provided, use it
    if (serviceAccount) {
        return initializeApp({
            credential: cert(serviceAccount),
            projectId: 'merchplace-prod',
        });
    }

    // Fallback: Initialize without credentials (works in GCP environment)
    // For local development, you need to set FIREBASE_SERVICE_ACCOUNT_KEY
    return initializeApp({
        projectId: 'merchplace-prod',
    });
}

const adminApp = initializeFirebaseAdmin();
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
