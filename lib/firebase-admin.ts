import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
    JSON.stringify(require("@/service-account.json"))
);

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
} else {
    getApp();
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
