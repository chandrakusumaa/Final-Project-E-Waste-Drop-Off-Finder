# SRS E-Waste Drop-Off Finder API

**Proyek** · Final Project Study Club Backend Basic

**Cakupan awal** · DKI Jakarta

**Stack** · JavaScript, Node.js, Express.js, MongoDB, npm, Git, dan GitHub

## 1. Masalah dan tujuan

Warga yang hendak membuang elektronik rusak perlu tahu lokasi yang menerima jenis barang mereka. Titik terdekat bisa berupa *dropbox* untuk barang kecil. Seseorang yang membawa monitor masih perlu mengecek apakah titik tersebut menerima monitor sebelum berangkat.

API ini membantu warga menjawab pertanyaan **“Di kecamatan gue, titik mana yang menerima barang elektronik ini?”** Respons menyediakan alamat, jenis barang yang diterima, dan jam layanan jika tersedia. Pengelola data memperbarui informasi lokasi melalui endpoint CRUD. Versi tugas mencakup satu koleksi MongoDB, lima endpoint, dan pengujian lokal lewat Postman.

## 2. Model data

Gunakan koleksi `titik_pengumpulan`. Satu dokumen mewakili satu titik pengumpulan. Simpan jenis barang sebagai array string di dalam dokumen yang sama.

| Field | Tipe | Aturan |
|---|---|---|
| `_id` | ObjectId | Dibuat oleh MongoDB atau driver saat menambah dokumen. |
| `nama` | String | Wajib. Nama titik pengumpulan. |
| `alamat` | String | Wajib. Alamat atau deskripsi lokasi. |
| `kecamatan` | String | Wajib. Rapikan spasi di awal dan akhir, lalu simpan dalam huruf kecil, misalnya `tebet`. |
| `tipe` | String | Wajib. Pilih `dropbox` atau `collection-point`. |
| `barangDiterima` | Array string | Wajib berisi minimal satu jenis barang. Rapikan spasi di awal dan akhir, ubah ke huruf kecil, dan simpan setiap jenis sekali. Tolak elemen kosong. |
| `status` | String | `aktif` atau `nonaktif`. Nilai awal `aktif`. |
| `jamLayanan` | String | Opsional. Isi sesuai informasi yang tersedia, misalnya `Senin–Jumat, 08.00–16.00 WIB`. |
| `sumberUrl` | String | Opsional pada API. Jika diisi, gunakan URL `http` atau `https`. |
| `terakhirDicek` | String | Opsional pada API. Jika diisi, gunakan tanggal kalender yang valid dalam format `YYYY-MM-DD`. |
| `simulasi` | Boolean | Nilai awal `false`. Gunakan `true` untuk data fiktif dalam demo. |

Untuk data faktual, isi `sumberUrl` dan `terakhirDicek`. Isi `barangDiterima` berdasarkan informasi untuk titik tersebut. Gunakan dokumen simulasi berlabel jika perlu menunjukkan contoh penerimaan barang yang belum terkonfirmasi. [Direktori titik pengumpulan DLH DKI Jakarta](https://ewaste.dinaslhdki.id/ewastesm) · [Panduan e-waste DLH DKI Jakarta](https://lingkunganhidup.jakarta.go.id/layanan/ewaste)

## 3. Kontrak API

Gunakan JSON untuk request dan response yang membawa data. Bungkus respons sukses dalam `data`. Untuk error, gunakan objek dengan field `message` yang menjelaskan masalahnya.

| Method | Path | Perilaku | Status sukses |
|---|---|---|---|
| `POST` | `/titik-pengumpulan` | Validasi body, simpan titik baru, dan kembalikan dokumen yang tersimpan. | `201 Created` |
| `GET` | `/titik-pengumpulan` | Kembalikan daftar titik. Terapkan filter dari query string jika diberikan. | `200 OK` |
| `GET` | `/titik-pengumpulan/:id` | Kembalikan satu titik berdasarkan ObjectId. | `200 OK` |
| `PATCH` | `/titik-pengumpulan/:id` | Ubah field yang dikirim dan kembalikan dokumen terbaru. Untuk `barangDiterima`, array yang dikirim menggantikan seluruh daftar lama. | `200 OK` |
| `DELETE` | `/titik-pengumpulan/:id` | Hapus satu titik berdasarkan ObjectId. | `204 No Content` |

### Filter daftar

- `barang` cocok dengan satu elemen lengkap dalam `barangDiterima`. Misalnya, `monitor` cocok dengan elemen `monitor`.
- `kecamatan` cocok dengan nama kecamatan. Untuk kedua filter tersebut, rapikan spasi di awal dan akhir serta abaikan perbedaan huruf besar dan kecil.
- `status` menerima `aktif` atau `nonaktif`. Gunakan `status=aktif` untuk demo pencarian warga.
- Setiap filter bersifat opsional. Jika beberapa filter diberikan, titik harus memenuhi semuanya. Daftar tanpa filter mengembalikan semua titik. Jika hasil kosong, kembalikan `200 OK` dengan `{"data":[]}`.

```http
GET /titik-pengumpulan?kecamatan=tebet&barang=monitor&status=aktif
```

### Contoh body `POST` untuk demo

```json
{
  "nama": "Titik Pengumpulan Demo Tebet",
  "alamat": "Alamat simulasi di Tebet",
  "kecamatan": "tebet",
  "tipe": "collection-point",
  "barangDiterima": ["monitor"],
  "status": "aktif",
  "simulasi": true
}
```

### Validasi dan penanganan error

| Kondisi | Respons |
|---|---|
| Body JSON rusak, nilai field tidak valid, query tidak valid, atau `PATCH` tanpa field | `400 Bad Request` dengan pesan yang menyebutkan input bermasalah. |
| `:id` gagal memenuhi format ObjectId 24 karakter heksadesimal | `400 Bad Request`. |
| Format `:id` valid dan dokumen tidak ditemukan | `404 Not Found` dengan pesan `Titik pengumpulan tidak ditemukan.` |
| Operasi database gagal secara tak terduga | `500 Internal Server Error` dengan pesan umum. Catat detail teknis di server. |

Gunakan field model yang bisa diubah sebagai daftar field body yang diterima. `_id` dibuat oleh sistem. Untuk filter, bentuk query MongoDB dari tiga parameter yang didukung dan terima setiap nilai sebagai satu string. Kembalikan `400` untuk field body atau parameter query di luar daftar. Gunakan `try...catch` untuk operasi database dan validasi field yang dikirim pada `PATCH` dengan aturan yang sama seperti `POST`.

## 4. Pedoman implementasi untuk coding agent

1. Pisahkan koneksi MongoDB, model data, controller, dan routes. Gunakan `express.json()` untuk membaca request JSON. Driver MongoDB resmi atau Mongoose dapat dipakai sesuai struktur repositori.
2. Baca `MONGODB_URI` dari environment dan gunakan `PORT` dengan nilai awal `3000`. Sambungkan MongoDB sebelum membuka port. Semua operasi CRUD membaca atau menulis koleksi MongoDB tersebut.
3. Sediakan `npm start`, `package-lock.json`, dan `.env.example` berisi contoh konfigurasi tanpa kredensial. Tambahkan `.env` dan `node_modules/` ke `.gitignore`.
4. Implementasikan kontrak API, lalu jalankan skenario pengujian di bawah. Catat hasil yang benar-benar diuji dan sebutkan pemeriksaan yang masih tertunda jika lingkungan MongoDB belum tersedia.

## 5. Skenario penerimaan

Mulai dengan database demo kosong dan collection Postman dengan variabel `baseUrl`. Simpan `_id` dari respons `POST` agar request berikutnya memakai dokumen yang sama.

| Langkah | Hasil yang diharapkan |
|---|---|
| Tambah dua titik simulasi aktif di Tebet. Titik A menerima `charger` dan `kabel`. Titik B menerima `monitor`. | Masing-masing mendapat `201` dan memiliki `_id`. |
| Panggil `GET /titik-pengumpulan`, lalu cari dengan `kecamatan=tebet&barang=monitor&status=aktif`. | Daftar awal memuat kedua titik. Filter mengembalikan titik B saja. |
| Buka detail titik B lewat `GET /titik-pengumpulan/:id`. | `200` dengan data titik B, termasuk `barangDiterima`. |
| Ubah status titik B menjadi `nonaktif` lewat `PATCH`, lalu jalankan filter yang sama. | `PATCH` mengembalikan `200` dengan status terbaru. Filter menghasilkan `200` dengan `{"data":[]}`. |
| Jalankan ulang server dan buka detail titik B. | Status `nonaktif` tetap tersimpan di MongoDB. |
| Hapus titik B lewat `DELETE`, lalu buka detailnya lagi. | `DELETE` mengembalikan `204`. Request detail berikutnya mengembalikan `404`. |
| Coba `POST` dengan `barangDiterima: []` dan `GET` detail dengan `:id` bernilai `abc`. | Keduanya mengembalikan `400` dengan pesan yang sesuai. |

## 6. Checklist pengumpulan tugas

- [ ] Lima endpoint bisa dijalankan dan collection Postman atau koleksi alat uji setara disertakan di repositori.
- [ ] `README.md` mencantumkan nama, NIM, judul proyek, cara instalasi, cara menjalankan server, environment variable, daftar endpoint, dan contoh filter. Isi nama dan NIM dengan data pemilik proyek.
- [ ] Repositori GitHub berstatus publik. Commit memakai pesan yang jelas dan semantik, misalnya `feat: add drop-off point filters`. Tautan repositori dikumpulkan lewat Dignition Veterantech.
- [ ] Presentasi disimpan sebagai PDF di repositori. Cantumkan judul aplikasi, nama mentee, arsitektur, tautan GitHub, HTTP method yang dipakai, dan kesimpulan.
