const { validateBody, validateQuery, parseId } = require('../models/titik-pengumpulan');

const NOT_FOUND = { message: 'Titik pengumpulan tidak ditemukan.' };

function createController(collection) {
  return {
    async list(req, res) {
      const filter = validateQuery(req.query);
      const data = await collection.find(filter).sort({ nama: 1, _id: 1 }).toArray();
      res.json({ data });
    },
    async get(req, res) {
      const data = await collection.findOne({ _id: parseId(req.params.id) });
      if (!data) return res.status(404).json(NOT_FOUND);
      res.json({ data });
    },
    async create(req, res) {
      const fields = validateBody(req.body);
      const { insertedId } = await collection.insertOne(fields);
      res.status(201).json({ data: { ...fields, _id: insertedId } });
    },
    async update(req, res) {
      const id = parseId(req.params.id);
      const fields = validateBody(req.body, { partial: true });
      const data = await collection.findOneAndUpdate(
        { _id: id },
        { $set: fields },
        { returnDocument: 'after', includeResultMetadata: false }
      );
      if (!data) return res.status(404).json(NOT_FOUND);
      res.json({ data });
    },
    async remove(req, res) {
      const { deletedCount } = await collection.deleteOne({ _id: parseId(req.params.id) });
      if (deletedCount === 0) return res.status(404).json(NOT_FOUND);
      res.status(204).end();
    }
  };
}

module.exports = { createController };
