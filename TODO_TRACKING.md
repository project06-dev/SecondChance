# TODO: Implementasi Fitur Tracking Pesanan

## Status: Dalam Progress

### Sudah Selesai:
- [x] Menambahkan CSS styles untuk order tracking page
- [x] Menambahkan HTML untuk order tracking page
- [x] Mengubah menu "Pesanan Saya" menjadi "Tracking Pesanan" di profile
- [x] Menambahkan variable `orders` array di state aplikasi
- [x] Fitur wishlist immediate removal sudah berfungsi

### Masih Perlu Dikerjakan:
- [ ] Menambahkan case 'orderTracking' di fungsi showPage()
- [ ] Membuat fungsi renderOrderTracking() untuk menampilkan daftar pesanan
- [ ] Membuat fungsi saveOrdersToStorage() dan loadOrdersFromStorage()
- [ ] Mengupdate fungsi confirmCheckout() untuk menyimpan order ke array orders
- [ ] Membuat fungsi showOrderDetail() untuk menampilkan detail tracking di modal
- [ ] Load orders dari localStorage saat initApp()

### Fitur yang Akan Ditambahkan:
1. **Order Data Structure:**
   - Order ID (auto-generated)
   - Tanggal pemesanan
   - Items (produk yang dibeli)
   - Total harga
   - Metode pengiriman
   - Metode pembayaran
   - Status tracking (processing, shipped, delivered)
   - Timeline tracking

2. **Tracking Timeline:**
   - Pesanan Dikonfirmasi
   - Sedang Diproses
   - Dalam Pengiriman
   - Tiba di Kota Tujuan
   - Sedang Dikirim ke Alamat
   - Pesanan Diterima

3. **Fitur Tambahan:**
   - Badge status (processing/shipped/delivered)
   - Tombol "Lihat Detail Tracking"
   - Tombol "Hubungi Penjual"
   - Empty state jika belum ada pesanan
