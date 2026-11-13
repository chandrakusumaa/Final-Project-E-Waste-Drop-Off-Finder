const { Router } = require('express');
const { createController } = require('../controllers/titik-pengumpulan');
const { ValidationError } = require('../models/titik-pengumpulan');

function createRoutes(collection) {
  const router = Router();
  const controller = createController(collection);
  function withoutQuery(req, res, next) {
    const fields = Object.keys(req.query);
    if (fields.length > 0) {
      return next(new ValidationError(`Parameter query ${fields[0]} hanya bisa digunakan pada GET daftar.`));
    }
    next();
  }

  router.route('/')
    .get(controller.list)
    .post(withoutQuery, controller.create);
  router.route('/:id')
    .get(withoutQuery, controller.get)
    .patch(withoutQuery, controller.update)
    .delete(withoutQuery, controller.remove);
  return router;
}

module.exports = { createRoutes };
