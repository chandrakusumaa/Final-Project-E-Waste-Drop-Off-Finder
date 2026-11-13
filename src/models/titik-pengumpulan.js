const { ObjectId } = require('mongodb');

const COLLECTION = 'titik_pengumpulan';
const TYPES = ['dropbox', 'collection-point'];
const STATUSES = ['aktif', 'nonaktif'];
const REQUIRED = ['nama', 'alamat', 'kecamatan', 'tipe', 'barangDiterima'];

class ValidationError extends Error {}

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${field} harus berupa string yang tidak kosong.`);
  }
  return value.trim();
}

function normalizedString(value, field) {
  return requiredString(value, field).toLowerCase();
}

function oneOf(value, field, options) {
  if (!options.includes(value)) {
    throw new ValidationError(`${field} harus salah satu dari: ${options.join(', ')}.`);
  }
  return value;
}

function items(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError('barangDiterima harus berupa array dengan minimal satu jenis barang.');
  }
  return [...new Set(value.map(item => normalizedString(item, 'Elemen barangDiterima')))];
}

function sourceUrl(value) {
  const input = requiredString(value, 'sumberUrl');
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new ValidationError('sumberUrl harus berupa URL http atau https yang valid.');
  }
  if (!/^https?:\/\//i.test(input) || !['http:', 'https:'].includes(url.protocol)) {
    throw new ValidationError('sumberUrl harus berupa URL http atau https yang valid.');
  }
  return input;
}

function checkedDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !value.startsWith('0000-')) {
    const parsed = new Date(value + 'T00:00:00Z');
    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value) {
      return value;
    }
  }
  throw new ValidationError('terakhirDicek harus berupa tanggal kalender yang valid (YYYY-MM-DD).');
}

const validateStatus = value => oneOf(value, 'status', STATUSES);
const validators = {
  nama: value => requiredString(value, 'nama'),
  alamat: value => requiredString(value, 'alamat'),
  kecamatan: value => normalizedString(value, 'kecamatan'),
  tipe: value => oneOf(value, 'tipe', TYPES),
  barangDiterima: items,
  status: validateStatus,
  jamLayanan(value) {
    if (typeof value !== 'string') throw new ValidationError('jamLayanan harus berupa string.');
    return value.trim();
  },
  sumberUrl: sourceUrl,
  terakhirDicek: checkedDate,
  simulasi(value) {
    if (typeof value !== 'boolean') throw new ValidationError('simulasi harus bernilai boolean.');
    return value;
  }
};

function validateBody(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Body harus berupa objek JSON.');
  }

  const entries = Object.entries(body);
  if (partial && entries.length === 0) {
    throw new ValidationError('Body PATCH harus memuat minimal satu field.');
  }
  const fields = partial ? {} : { status: 'aktif', simulasi: false };
  for (const [key, value] of entries) {
    if (!Object.hasOwn(validators, key)) {
      throw new ValidationError(`Field ${key} tidak didukung.`);
    }
    fields[key] = validators[key](value);
  }
  if (!partial) {
    const missing = REQUIRED.find(key => !Object.hasOwn(fields, key));
    if (missing) throw new ValidationError(`Field ${missing} wajib diisi.`);
  }
  return fields;
}

function validateQuery(query) {
  const filter = {};
  for (const [key, value] of Object.entries(query)) {
    switch (key) {
      case 'kecamatan':
        filter.kecamatan = normalizedString(value, 'kecamatan');
        break;
      case 'barang':
        filter.barangDiterima = normalizedString(value, 'barang');
        break;
      case 'status':
        filter.status = validateStatus(value);
        break;
      default:
        throw new ValidationError(`Parameter query ${key} tidak didukung.`);
    }
  }
  return filter;
}

function parseId(value) {
  if (!/^[\da-fA-F]{24}$/.test(value)) {
    throw new ValidationError('id harus berupa ObjectId dengan 24 karakter heksadesimal.');
  }
  return new ObjectId(value);
}

module.exports = { COLLECTION, ValidationError, validateBody, validateQuery, parseId };
