const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Article validation
const validateArticleQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
    .toInt(),
  
  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters')
    .matches(/^[a-zA-Z0-9\s-_]+$/)
    .withMessage('Category contains invalid characters'),
  
  handleValidationErrors
];

const validateArticleId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid article ID format'),
  
  handleValidationErrors
];

const validateDateParam = [
  param('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters')
    .matches(/^[a-zA-Z0-9\s\-_'".,!?]+$/)
    .withMessage('Search query contains invalid characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
  
  handleValidationErrors
];

// Rate limiting bypass validation (for testing)
const validateSystemAccess = [
  body('api_key')
    .optional()
    .isLength({ min: 32, max: 64 })
    .withMessage('Invalid API key format'),
  
  handleValidationErrors
];

// Content sanitization helpers
const sanitizeString = (str, maxLength = 1000) => {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength);
};

const sanitizeArray = (arr, maxItems = 10) => {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, maxItems).map(item => sanitizeString(item));
};

// Generic validation middleware factory
const createValidation = (rules) => {
  return [...rules, handleValidationErrors];
};

module.exports = {
  validateArticleQuery,
  validateArticleId,
  validateDateParam,
  validateSearch,
  validateSystemAccess,
  handleValidationErrors,
  sanitizeString,
  sanitizeArray,
  createValidation
}; 