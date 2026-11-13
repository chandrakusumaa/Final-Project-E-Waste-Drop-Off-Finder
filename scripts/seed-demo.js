const { ObjectId } = require('mongodb');
const { connectDatabase } = require('../src/config/database');
const { COLLECTION, validateBody } = require('../src/models/titik-pengumpulan');

const examples = [
  {
    nama: 'Pos Pengumpulan Tebet',
    alamat: 'Jl. Tebet Barat, Jakarta Selatan (simulasi)',
    kecamatan: 'tebet',
    tipe: 'collection-point',
    barangDiterima: ['monitor', 'laptop', 'kabel'],
    jamLayanan: 'Senin–Jumat, 08.00–16.00 WIB'
  },
  {
    nama: 'Dropbox Tebet',
    alamat: 'Jl. Tebet Timur, Jakarta Selatan (simulasi)',
    kecamatan: 'tebet',
    tipe: 'dropbox',
    barangDiterima: ['charger', 'kabel', 'ponsel'],
    jamLayanan: 'Senin–Sabtu, 09.00–17.00 WIB'
  },
  {
    nama: 'Pos Pengumpulan Menteng',
    alamat: 'Jl. Cikini Raya, Jakarta Pusat (simulasi)',
    kecamatan: 'menteng',
    tipe: 'collection-point',
    barangDiterima: ['monitor', 'printer', 'laptop', 'kabel']
  },
  {
    nama: 'Dropbox Kebayoran Baru',
    alamat: 'Jl. Panglima Polim, Jakarta Selatan (simulasi)',
    kecamatan: 'kebayoran baru',
    tipe: 'dropbox',
    barangDiterima: ['charger', 'ponsel', 'kabel'],
    jamLayanan: 'Setiap hari, 10.00–19.00 WIB'
  }
];

async function seed() {
  const { client, db } = await connectDatabase();
  try {
    const collection = db.collection(COLLECTION);
    const operations = examples.map((point, index) => ({
      updateOne: {
        filter: { _id: new ObjectId(`de000000000000000000000${index + 1}`) },
        update: { $setOnInsert: validateBody({ ...point, simulasi: true }) },
        upsert: true
      }
    }));
    const result = await collection.bulkWrite(operations);
    console.log(`${result.upsertedCount} lokasi simulasi ditambahkan.`);
  } finally {
    await client.close();
  }
}

seed().catch(error => {
  console.error('Gagal menambahkan data simulasi:', error.message);
  process.exitCode = 1;
});
