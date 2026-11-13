# Titik Balik · E-Waste Drop-Off Finder

Aplikasi web untuk mencari titik pengumpulan elektronik bekas di DKI Jakarta berdasarkan kecamatan dan jenis barang. Daftar lokasi menampilkan alamat dan barang yang diterima. Detail lokasi menampilkan jam layanan dan sumber informasi jika tersedia.

**Nama mentee** · Chandra Kusuma (akun GitHub `chandrakusumaa`)

**NIM** · Isi sebelum pengumpulan

## Jalankan secara lokal

Butuh Node.js 22.9 atau lebih baru, npm, dan MongoDB yang bisa diakses.

```bash
npm ci
cp .env.example .env
npm run seed:demo
npm start
```

Buka [http://localhost:3000](http://localhost:3000). Untuk mencoba pencarian, pilih **Tebet** dan **Monitor**, klik **Cari lokasi**, lalu buka hasilnya. Pilih **Kebayoran Baru** dan **Monitor** untuk mencoba hasil kosong. Seed bersifat opsional dan aman dijalankan ulang. Lokasi dari seed berlabel simulasi.

| Variabel | Fungsi |
| --- | --- |
| `MONGODB_URI` | URI MongoDB beserta nama database. Contoh lokal `mongodb://127.0.0.1:27017/titik_balik`. |
| `PORT` | Port HTTP. Nilai awal `3000`. |
| `HOST` | Alamat server. Nilai awal `127.0.0.1` untuk pengujian lokal. |

Di PowerShell, ganti perintah `cp` dengan `Copy-Item .env.example .env`. Jika memakai MongoDB Atlas, isi `MONGODB_URI` di `.env`.

## API

| Method | Endpoint | Hasil |
| --- | --- | --- |
| `GET` | `/titik-pengumpulan` | `200` · Daftar titik, dengan filter opsional `kecamatan`, `barang`, dan `status`. |
| `GET` | `/titik-pengumpulan/:id` | `200` · Detail satu titik. |
| `POST` | `/titik-pengumpulan` | `201` · Titik baru. |
| `PATCH` | `/titik-pengumpulan/:id` | `200` · Titik yang sudah diperbarui. |
| `DELETE` | `/titik-pengumpulan/:id` | `204` · Titik dihapus. |

```bash
curl "http://localhost:3000/titik-pengumpulan?kecamatan=tebet&barang=monitor&status=aktif"
```

```bash
curl -X POST "http://localhost:3000/titik-pengumpulan" \
  -H "Content-Type: application/json" \
  -d '{"nama":"Pos Demo Tebet","alamat":"Alamat simulasi di Tebet","kecamatan":"tebet","tipe":"collection-point","barangDiterima":["monitor"],"simulasi":true}'
```

Respons sukses yang membawa data menggunakan `{"data": ...}`. Error menggunakan `{"message": "..."}`. Filter `barang` mencocokkan satu elemen penuh. Jika beberapa filter dikirim, titik harus memenuhi semuanya. Pada `PATCH`, `barangDiterima` menggantikan seluruh array.

Frontend memakai HTML, CSS, dan JavaScript. Express melayani halaman dan API dari origin yang sama. Controller mengakses satu koleksi MongoDB bernama `titik_pengumpulan`. Endpoint CRUD dipakai untuk demo lokal sesuai SRS.

## Uji dan presentasi

Impor [koleksi Postman](postman/Titik_Balik.postman_collection.json). Jalankan bagian **1 · CRUD dan validasi** pada database demo kosong tanpa menjalankan seed, supaya filter pengujian hanya berisi data yang dibuat koleksi. Setelah titik B dinonaktifkan, restart server dengan URI MongoDB yang sama dan jalankan bagian **2 · Persistensi dan pembersihan**. Koleksi menyimpan ID melalui variabel Postman.

[SRS proyek](docs/SRS.md) · [Presentasi PDF](docs/Presentasi_Titik_Balik.pdf)
