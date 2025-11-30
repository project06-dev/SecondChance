// ============================================
// FIREBASE CONFIGURATION
// ============================================
// PENTING: Ganti konfigurasi di bawah dengan konfigurasi Firebase Anda sendiri
// Cara mendapatkan: Ikuti FIREBASE_SETUP_GUIDE.md Langkah 6

const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY_ANDA",
  authDomain: "GANTI_DENGAN_AUTH_DOMAIN_ANDA",
  projectId: "GANTI_DENGAN_PROJECT_ID_ANDA",
  storageBucket: "GANTI_DENGAN_STORAGE_BUCKET_ANDA",
  messagingSenderId: "GANTI_DENGAN_MESSAGING_SENDER_ID_ANDA",
  appId: "GANTI_DENGAN_APP_ID_ANDA",
  databaseURL: "GANTI_DENGAN_DATABASE_URL_ANDA"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();
const storage = firebase.storage();

// Export untuk digunakan di file lain
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseRTDB = rtdb;
window.firebaseStorage = storage;

console.log('Firebase initialized successfully!');
