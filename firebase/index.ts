import admin from "firebase-admin"

const firebaseAccountCredentials = require('../serviceAccountKey.json')

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(firebaseAccountCredentials),
        storageBucket: process.env.FIREBASE_BUCKET,
    });
}

const storage= admin.storage().bucket()

export default storage