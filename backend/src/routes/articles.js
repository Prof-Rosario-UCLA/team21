const express = require('express');
const router = express.Router();
const pipelineService = require('../services/pipeline');

// Get recent articles
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const articles = await pipelineService.getRecentArticles(limit);
    
    res.json({
      success: true,
      articles: articles,
      count: articles.length
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles',
      error: error.message
    });
  }
});

// Get specific article by ID
router.get('/:id', async (req, res) => {
  try {
    const article = await pipelineService.getArticleById(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      article: article
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article',
      error: error.message
    });
  }
});

/* FOR DEVELOPMENT ONLY : REMOVE LATER */

// Trigger pipeline manually
router.post('/generate', async (req, res) => {
  try {
    console.log('Manual pipeline trigger requested');
    const result = await pipelineService.runFullPipeline();
    
    res.json(result);
  } catch (error) {
    console.error('Error running pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run pipeline',
      error: error.message
    });
  }
});

// Get system stats
router.get('/system/stats', async (req, res) => {
  try {
    const stats = await pipelineService.getSystemStats();
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system stats',
      error: error.message
    });
  }
});

// Test all services
router.get('/system/test', async (req, res) => {
  try {
    const results = await pipelineService.testAllServices();
    
    const allSuccessful = Object.values(results).every(result => result.success);
    
    res.json({
      success: allSuccessful,
      message: allSuccessful ? 'All services operational' : 'Some services have issues',
      services: results
    });
  } catch (error) {
    console.error('Error testing services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test services',
      error: error.message
    });
  }
});

module.exports = router; 