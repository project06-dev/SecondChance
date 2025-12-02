# Loading Screen - Second Chance Website

## Deskripsi
Loading screen elegant yang muncul saat pertama kali membuka website, dengan tema warna ungu dan coklat yang konsisten dengan desain website.

## Fitur Loading Screen

### Visual Elements:
1. **Background Gradient**: Gradasi warna dari ungu muda (#e6ccff) ke ungu tua (#b19cd9) dan coklat (#d4a574)
2. **Logo Container**: Kotak putih rounded dengan shadow yang berisi logo Second Chance
3. **Decorative Flowers**: 4 bunga dekoratif di sekitar logo dengan animasi float
4. **Loading Text**: Teks "Second Chance" dengan efek fade in/out
5. **Loading Bar**: Progress bar animasi di bagian bawah

### Animasi:
- **Pulse Animation**: Logo bergerak naik-turun dengan efek scale
- **Float Animation**: Bunga-bunga bergerak melayang dengan rotasi halus
- **Fade In/Out**: Teks loading berkedip lembut
- **Loading Bar**: Progress bar yang bergerak dari 0% ke 100%
- **Fade Out**: Transisi smooth saat loading screen menghilang

### Durasi:
- Loading screen tampil selama **2.5 detik**
- Fade out animation selama **0.8 detik**
- Total waktu: **3.3 detik** sebelum konten utama muncul

### Responsive Design:
- Loading screen otomatis menyesuaikan dengan ukuran layar
- Tetap centered di semua device (desktop, tablet, mobile)

## Cara Kerja

1. Saat halaman dimuat, body memiliki class `loading`
2. Loading screen ditampilkan dengan `z-index: 9999` (di atas semua elemen)
3. Konten utama (container) disembunyikan dengan `opacity: 0`
4. Setelah 2.5 detik, JavaScript menambahkan class `hidden` ke loading screen
5. Loading screen fade out dan konten utama fade in
6. Setelah animasi selesai, loading screen dihapus dari DOM

## Kustomisasi

### Mengubah Durasi Loading:
Edit baris ini di JavaScript:
```javascript
}, 2500); // Ubah angka ini (dalam milidetik)
```

### Mengubah Warna Background:
Edit di CSS:
```css
background: linear-gradient(135deg, #e6ccff 0%, #b19cd9 50%, #d4a574 100%);
```

### Mengubah Teks Loading:
Edit di HTML:
```html
<div class="loading-text">Second Chance</div>
```

## Kompatibilitas
- ✅ Chrome/Edge (Modern)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile Browsers
- ✅ Responsive untuk semua ukuran layar

## File yang Dimodifikasi
- `index.html` - Menambahkan loading screen HTML, CSS, dan JavaScript

## Catatan
- Loading screen hanya muncul saat pertama kali membuka halaman
- Tidak muncul saat refresh atau navigasi antar form
- Menggunakan animasi CSS yang smooth dan performa optimal
- Logo menggunakan URL yang sama dengan logo di halaman login
