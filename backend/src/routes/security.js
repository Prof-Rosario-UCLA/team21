const express = require('express');
const router = express.Router();
const { generateCSRFToken } = require('../middleware/security');

// Get CSRF token endpoint
router.get('/csrf-token', generateCSRFToken, (req, res) => {
  try {
    res.json({
      success: true,
      csrf_token: res.locals.csrfToken,
      csrf_secret: res.locals.csrfSecret,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSRF token'
    });
  }
});

// Security status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    security_features: {
      csrf_protection: true,
      xss_protection: true,
      sql_injection_protection: true,
      rate_limiting: true,
      input_validation: true,
      security_headers: true,
      parameter_pollution_protection: true
    },
    message: 'Security features are active'
  });
});

module.exports = router; 