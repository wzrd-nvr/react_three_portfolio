import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const app = initializeApp({
  apiKey: import.meta.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: import.meta.env.REACT_APP_FIREBASE_APP_ID,
});

export const db = getFirestore(app);

const emulatorHost = import.meta.env.REACT_APP_FIRESTORE_EMULATOR_HOST;
if (emulatorHost) {
  const [host, port] = emulatorHost.split(':');
  connectFirestoreEmulator(db, host, Number(port));
}
