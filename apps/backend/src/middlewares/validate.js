const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(({ type, msg, path, location }) => ({ type, msg, path, location }));
    return res.status(400).json({ error: details[0].msg, errors: details });
  }
  next();
}

module.exports = validate;
