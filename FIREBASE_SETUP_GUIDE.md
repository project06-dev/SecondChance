# 🔥 Firebase Setup Guide - Second Chance Website

## Langkah 1: Buat Akun Firebase

1. Buka https://console.firebase.google.com/
2. Login dengan akun Google Anda
3. Klik "Add project" atau "Tambah project"
4. Beri nama project: **SecondChance** (atau nama lain yang Anda inginkan)
5. Disable Google Analytics (opsional, bisa diaktifkan nanti)
6. Klik "Create project"

---

## Langkah 2: Setup Firebase Authentication

1. Di Firebase Console, pilih project Anda
2. Klik **"Authentication"** di menu kiri
3. Klik **"Get started"**
4. Pilih **"Email/Password"** sebagai sign-in method
5. **Enable** Email/Password
6. Klik **"Save"**

---

## Langkah 3: Setup Firestore Database

1. Di Firebase Console, klik **"Firestore Database"** di menu kiri
2. Klik **"Create database"**
3. Pilih **"Start in test mode"** (untuk development)
4. Pilih lokasi server: **asia-southeast1** (Singapore) atau **asia-southeast2** (Jakarta)
5. Klik **"Enable"**

---

## Langkah 4: Setup Realtime Database (untuk Chat)

1. Di Firebase Console, klik **"Realtime Database"** di menu kiri
2. Klik **"Create Database"**
3. Pilih lokasi yang sama dengan Firestore
4. Pilih **"Start in test mode"**
5. Klik **"Enable"**

---

## Langkah 5: Setup Firebase Storage (untuk Upload Gambar)

1. Di Firebase Console, klik **"Storage"** di menu kiri
2. Klik **"Get started"**
3. Pilih **"Start in test mode"**
4. Klik **"Next"**
5. Pilih lokasi yang sama
6. Klik **"Done"**

---

## Langkah 6: Dapatkan Firebase Config

1. Di Firebase Console, klik **icon gear (⚙️)** di samping "Project Overview"
2. Klik **"Project settings"**
3. Scroll ke bawah ke bagian **"Your apps"**
4. Klik icon **"</>"** (Web)
5. Beri nama app: **SecondChance Web**
6. **JANGAN** centang "Also set up Firebase Hosting"
7. Klik **"Register app"**
8. **COPY** kode konfigurasi yang muncul (seperti ini):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "secondchance-xxxxx.firebaseapp.com",
  projectId: "secondchance-xxxxx",
  storageBucket: "secondchance-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx",
  databaseURL: "https://secondchance-xxxxx-default-rtdb.asia-southeast1.firebasedatabase.app"
};
```

9. **SIMPAN** konfigurasi ini, Anda akan membutuhkannya nanti

---

## Langkah 7: Update Firestore Rules (Security)

1. Di Firebase Console, buka **"Firestore Database"**
2. Klik tab **"Rules"**
3. Ganti rules dengan:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true; // Anyone can read products
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.sellerId == request.auth.uid;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (resource.data.buyerId == request.auth.uid || 
         resource.data.sellerId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        resource.data.sellerId == request.auth.uid;
    }
    
    // Addresses collection
    match /addresses/{addressId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

4. Klik **"Publish"**

---

## Langkah 8: Update Realtime Database Rules (untuk Chat)

1. Di Firebase Console, buka **"Realtime Database"**
2. Klik tab **"Rules"**
3. Ganti rules dengan:

```json
{
  "rules": {
    "chats": {
      "$chatId": {
        ".read": "auth != null && (data.child('participants').child(auth.uid).exists())",
        ".write": "auth != null && (data.child('participants').child(auth.uid).exists() || !data.exists())"
      }
    },
    "users": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

4. Klik **"Publish"**

---

## Langkah 9: Update Storage Rules (untuk Upload Gambar)

1. Di Firebase Console, buka **"Storage"**
2. Klik tab **"Rules"**
3. Ganti rules dengan:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.resource.size < 5 * 1024 * 1024; // Max 5MB
    }
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Klik **"Publish"**

---

## Langkah 10: Paste Firebase Config ke Website

1. Buka file `firebase-config.js` yang sudah saya buatkan
2. **GANTI** konfigurasi dummy dengan konfigurasi Firebase Anda dari Langkah 6
3. Save file

---

## ✅ Setelah Setup Selesai:

Website Anda akan memiliki fitur:
- ✅ **Real-time Chat** - Chat langsung dengan penjual
- ✅ **User Authentication** - Login/Register dengan email
- ✅ **Cloud Database** - Data tersimpan di cloud, bisa diakses dari device manapun
- ✅ **Real-time Sync** - Perubahan data langsung tersinkronisasi
- ✅ **Upload Gambar** - Gambar produk tersimpan di cloud
- ✅ **Multi-user** - Banyak user bisa berinteraksi secara bersamaan

---

## 🚀 Testing:

1. Buka `index.html` di browser
2. Register akun baru
3. Login dengan akun tersebut
4. Coba tambah produk
5. Buka di browser/device lain, login dengan akun berbeda
6. Coba chat dengan penjual
7. Coba beli produk

---

## 📞 Troubleshooting:

### Error: "Firebase not defined"
- Pastikan koneksi internet aktif
- Pastikan Firebase SDK ter-load dengan benar

### Error: "Permission denied"
- Cek Firebase Rules sudah di-publish
- Pastikan user sudah login

### Chat tidak real-time
- Cek Realtime Database sudah di-enable
- Cek databaseURL ada di config

### Upload gambar gagal
- Cek Storage sudah di-enable
- Cek ukuran gambar < 5MB
- Cek Storage Rules sudah di-publish

---

## 💡 Tips:

1. **Jangan share** Firebase config ke publik (API key bisa disalahgunakan)
2. **Gunakan environment variables** untuk production
3. **Upgrade ke Blaze Plan** jika traffic tinggi (pay-as-you-go)
4. **Monitor usage** di Firebase Console untuk avoid over-quota
5. **Backup data** secara berkala

---

## 📚 Resources:

- Firebase Docs: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com/
- Firebase Pricing: https://firebase.google.com/pricing

---

Selamat! Website Anda sekarang sudah real-time dan multi-user! 🎉
