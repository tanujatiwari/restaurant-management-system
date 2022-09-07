import admin, { ServiceAccount } from "firebase-admin"

import firebaseAdminCred from '../serviceKey.json'

const firebaseAccountCredentials = firebaseAdminCred as ServiceAccount

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(firebaseAccountCredentials),
        storageBucket: process.env.FIREBASE_BUCKET,
    });
}

const storage= admin.storage().bucket()

export default storage