const path = require('node:path');
const express = require('express');
const { COLLECTION, ValidationError } = require('./models/titik-pengumpulan');
const { createRoutes } = require('./routes/titik-pengumpulan');

function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.set('query parser', 'simple');

  app.use(express.json());
  app.use('/titik-pengumpulan', createRoutes(db.collection(COLLECTION)));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use((req, res) => res.status(404).json({ message: 'Halaman atau endpoint tidak ditemukan.' }));

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof ValidationError) return res.status(400).json({ message: error.message });
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Body JSON tidak valid.' });
    }
    if (error instanceof URIError && error.status === 400) {
      return res.status(400).json({ message: 'Parameter URL tidak valid.' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ message: 'Ukuran body melebihi batas.' });
    }
    if (error.status === 415) {
      return res.status(415).json({ message: 'Format atau encoding body tidak didukung.' });
    }
    console.error(`[${req.method} ${req.path}]`, error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  });
  return app;
}

module.exports = { createApp };
