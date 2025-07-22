🚀 **PANDUAN DEPLOYMENT MASS LAUNDRY - CLEAR CACHE**

## ❗ MASALAH CACHE SAAT DEPLOYMENT

Jika perubahan logo dan fitur baru belum muncul saat deploy, ini karena masalah **browser cache** dan **PWA service worker**. Berikut solusinya:

---

## 🔄 **SOLUSI 1: CLEAR CACHE BROWSER (UNTUK USER)**

### **Chrome/Edge:**
1. Tekan `Ctrl + Shift + Delete` (Windows) atau `Cmd + Shift + Delete` (Mac)
2. Pilih "All time" atau "Semua waktu"  
3. Centang:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
4. Klik **Clear data**

### **Mobile (Android/iOS):**
1. Buka Settings browser
2. Cari "Storage" atau "Penyimpanan"
3. Klik "Clear browsing data"
4. Pilih "All time"
5. Clear cache + cookies

### **Hard Refresh:**
- **Desktop**: `Ctrl + F5` atau `Ctrl + Shift + R`
- **Mobile**: Swipe down pada halaman untuk refresh

---

## ⚡ **SOLUSI 2: PWA SERVICE WORKER RESET**

### **Method 1 - Developer Tools:**
1. Buka **Chrome DevTools** (F12)
2. Go to **Application** tab
3. Klik **Service Workers** 
4. Klik **Unregister** pada Mass Laundry
5. Klik **Clear Storage** 
6. Refresh halaman (F5)

### **Method 2 - Application Settings:**
1. Chrome → Settings → Advanced → Privacy & Security
2. Site Settings → Mass Laundry
3. Clear & Reset
4. Reload aplikasi

---

## 🛠️ **SOLUSI 3: UNTUK DEVELOPER/ADMIN**

### **Update Service Worker Version:**
```javascript
// Update di sw.js - ganti timestamp
const CACHE_VERSION = 'mass-laundry-v' + Date.now();
```

### **Force Update via JavaScript Console:**
```javascript
// Jalankan di browser console
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    registrations.forEach(function(registration) {
      registration.unregister();
    });
    window.location.reload();
  });
}
```

### **Clear All Caches:**
```javascript
// Jalankan di browser console  
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        return caches.delete(cacheName);
      })
    );
  }).then(function() {
    window.location.reload();
  });
}
```

---

## 🎯 **SOLUSI 4: DEPLOYMENT BEST PRACTICES**

### **1. Server Restart:**
```bash
sudo supervisorctl restart all
```

### **2. Clear Browser Data URLs:**
- Chrome: `chrome://settings/clearBrowserData`
- Edge: `edge://settings/clearBrowserData`  
- Firefox: `about:preferences#privacy`

### **3. Incognito/Private Mode:**
Buka aplikasi dalam mode incognito untuk test tanpa cache

### **4. Different Browser:**
Test di browser berbeda (Chrome → Firefox → Safari)

---

## 🔍 **VERIFICATION CHECKLIST**

### ✅ **Cek Logo Berhasil Update:**
1. Login page menampilkan logo bulat biru dengan gradient
2. Text "Mass Laundry" dan "Sistem Manajemen Laundry"
3. Tab "🎨 Kustomisasi" muncul di navigation
4. PWA icon saat install/save to home screen updated

### ✅ **Cek Fitur Estimasi Manual:**
1. Tab Kustomisasi → Layanan → Tambah Layanan
2. Form durasi: Hari + Jam + Menit dropdowns
3. Preview estimasi real-time
4. Tips penggunaan tersedia

### ✅ **Cek Console Logs:**
Buka Developer Tools → Console, harus ada:
```
🔄 Forcing service worker update...
🗑️ Clearing cache: mass-laundry-v[timestamp]
✅ All cache cleared - forcing clients claim
```

---

## ⚡ **QUICK FIX (EMERGENCY):**

1. **Hard refresh**: `Ctrl + F5`
2. **Clear cache**: `Ctrl + Shift + Delete` → Clear all
3. **Incognito mode**: Test tanpa cache
4. **Different device**: Test di HP/laptop lain

---

## 🎯 **CONTACT UNTUK BANTUAN:**

Jika masih bermasalah setelah mengikuti panduan ini:
1. Screenshot error/masalah yang terjadi  
2. Sebutkan browser dan versi yang digunakan
3. Device: Desktop/Mobile, OS version
4. Langkah mana yang sudah dicoba

**Cache clearing sudah diimplementasi otomatis di aplikasi, tapi browser mungkin perlu manual clear untuk pertama kali!** 🚀