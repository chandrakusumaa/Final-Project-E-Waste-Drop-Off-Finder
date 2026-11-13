const { MongoClient } = require('mongodb');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI wajib diisi. Lihat .env.example.');
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db();
    await db.command({ ping: 1 });
    return { client, db };
  } catch (error) {
    await client.close();
    throw error;
  }
}

module.exports = { connectDatabase };
