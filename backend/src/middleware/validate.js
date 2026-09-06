import ApiError from '../utils/ApiError.js';

/**
 * Joi validation middleware factory.
 * Returns middleware that validates req.body, req.query, or req.params
 * against the provided Joi schema.
 *
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} source - Request property to validate
 */
const validate = (schema, source = 'body') => {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', errors));
    }

    // Replace with validated + sanitized values
    req[source] = value;
    next();
  };
};

export default validate;
