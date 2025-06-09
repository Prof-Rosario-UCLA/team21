const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const csrf = require('csrf');
const xss = require('xss');
const helmet = require('helmet');
const csrfTokens = csrf();

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retry_after: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Don't rate limit localhost for testing
    // skip: (req) => {
    //   if (process.env.NODE_ENV === 'development' && 
    //       (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
    //     return true;
    //   }
    //   return false;
    // }
  });
};

// Different rate limits for different endpoints
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests from this IP, please try again later.'
);

const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per 15 minutes
  'Too many authentication attempts, please try again later.'
);

const apiLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  50, // 50 requests per 5 minutes
  'API rate limit exceeded, please try again later.'
);

// CSRF Protection Middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for certain endpoints that should be publicly accessible
  const publicEndpoints = [
    '/api/articles/generate',
    '/api/health',
    '/api/articles',
    '/api/articles/today',
    '/api/articles/past',
  ];

  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    req.path === endpoint || req.path.startsWith(endpoint + '/')
  );

  if (req.method === 'GET' || isPublicEndpoint) {
    return next();
  }

  // Validate CSRF token if not public endpoint
  const token = req.get('X-CSRF-Token') || req.body._csrf;
  const secret = req.session?.csrfSecret || req.get('X-CSRF-Secret');

  if (!token || !secret) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing'
    });
  }

  try {
    if (!csrfTokens.verify(secret, token)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token'
      });
    }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed'
    });
  }
};

// Generate CSRF token endpoint
const generateCSRFToken = (req, res, next) => {
  try {
    const secret = csrfTokens.secretSync();
    const token = csrfTokens.create(secret);
    
    if (req.session) {
      req.session.csrfSecret = secret;
    }
    
    res.locals.csrfToken = token;
    res.locals.csrfSecret = secret;
    
    next();
  } catch (error) {
    console.error('CSRF token generation error:', error);
    next();
  }
};

// Input sanitization (for database and XSS protection)
const sanitizeInput = (req, res, next) => {
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized potentially malicious input: ${key}`);
    }
  })(req, res, () => {
    const sanitizeObject = (obj) => {
      if (typeof obj === 'string') {
        return xss(obj, {
          whiteList: {},
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script']
        });
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (let key in obj) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  });
};

// Configure Helmet with custom CSP for our app
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
});

// Ensure proper parameters
const hppProtection = hpp({
  whitelist: ['tags', 'categories']
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  csrfProtection,
  generateCSRFToken,
  sanitizeInput,
  helmetMiddleware,
  hppProtection
}; 