const { once } = require('node:events');
const { connectDatabase } = require('./config/database');
const { createApp } = require('./app');

async function start() {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT harus berupa bilangan bulat dari 1 sampai 65535.');
  }

  const { client, db } = await connectDatabase();
  const host = process.env.HOST || '127.0.0.1';
  const server = createApp(db).listen(port, host);
  try {
    await once(server, 'listening');
  } catch (error) {
    await client.close();
    throw error;
  }

  console.log(`Titik Balik berjalan di http://${host}:${port}`);
  function stop() {
    server.close(async () => {
      try {
        await client.close();
      } catch (error) {
        console.error('Gagal menutup koneksi MongoDB:', error);
        process.exitCode = 1;
      }
    });
  }
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

start().catch(error => {
  console.error('Gagal menjalankan aplikasi:', error.message);
  process.exitCode = 1;
});
