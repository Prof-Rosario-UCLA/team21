const express = require('express');
const router = express.Router();
const pipelineService = require('../services/pipeline');
const Comment = require('../models/Comment');
const { auth } = require('../middleware/auth');
const {
  validateArticleQuery,
  validateArticleId,
  validateDateParam
} = require('../middleware/validation');

// Get recent articles
router.get('/', validateArticleQuery, async (req, res) => {
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

// Get today's articles with daily summary
router.get('/today', async (req, res) => {
  try {
    const [todaysArticles, dailySummary] = await Promise.all([
      pipelineService.getTodaysArticles(),
      pipelineService.getDailySummary()
    ]);
    
    res.json({
      success: true,
      daily_summary: dailySummary,
      articles: todaysArticles,
      count: todaysArticles.length
    });
  } catch (error) {
    console.error('Error fetching today\'s articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s articles',
      error: error.message
    });
  }
});

// Get past articles (before today)
router.get('/past', async (req, res) => {
  try {
    const pastArticles = await pipelineService.getPastArticles();
    
    res.json({
      success: true,
      articles: pastArticles,
      count: pastArticles.length
    });
  } catch (error) {
    console.error('Error fetching past articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch past articles',
      error: error.message
    });
  }
});

// Get daily summary by date
router.get('/daily-summary/:date?', validateDateParam, async (req, res) => {
  try {
    const date = req.params.date; // Optional date parameter
    const dailySummary = await pipelineService.getDailySummary(date);
    
    if (!dailySummary) {
      return res.status(404).json({
        success: false,
        message: 'No daily summary found for this date'
      });
    }
    
    res.json({
      success: true,
      daily_summary: dailySummary
    });
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily summary',
      error: error.message
    });
  }
});

// Get specific article by ID
router.get('/:id', validateArticleId, async (req, res) => {
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

// Get comments for a specific article
router.get('/:id/comments', validateArticleId, async (req, res) => {
  try {
    const comments = await Comment.find({ article: req.params.id })
      .sort({ created_at: -1 })
      .lean();
    
    res.json({
      success: true,
      comments: comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
});

// Create a comment for an article
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const articleId = req.params.id;
    const { content, type = 'text', audioData, audioDuration, audioFormat = 'webm' } = req.body;

    // Validate article exists
    const article = await pipelineService.getArticleById(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Validate based on comment type
    if (type === 'text' && !content?.trim()) {
      return res.status(400).json({ error: 'Content is required for text comments' });
    }

    if (type === 'voice') {
      if (!audioData) {
        return res.status(400).json({ error: 'Audio data is required for voice comments' });
      }
      if (!audioDuration || audioDuration <= 0) {
        return res.status(400).json({ error: 'Valid audio duration is required for voice comments' });
      }
    }

    // Create comment data
    const commentData = {
      article: articleId,
      author: req.user.id,
      type
    };

    if (type === 'text') {
      commentData.content = content.trim();
    } else if (type === 'voice') {
      commentData.audioData = audioData;
      commentData.audioDuration = audioDuration;
      commentData.audioFormat = audioFormat;
    }

    // Create the comment
    const comment = new Comment(commentData);
    await comment.save();

    // Populate author information for response
    await comment.populate('author', 'name email profilePicture');

    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

/* FOR DEVELOPMENT ONLY : REMOVE LATER */

// Reset timestamp to force re-processing of articles
router.post('/reset-timestamp', async (req, res) => {
  try {
    const Metadata = require('../models/Metadata');
    
    // Delete the last scraped timestamp
    await Metadata.deleteOne({ key: 'last_scraped_timestamp' });
    
    console.log('Reset last scraped timestamp - next run will process past 2 days');
    
    res.json({
      success: true,
      message: 'Timestamp reset successfully. Next pipeline run will fetch posts from past 2 days.',
      note: 'Run /api/articles/generate to trigger pipeline with reset timestamp'
    });
  } catch (error) {
    console.error('Error resetting timestamp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset timestamp',
      error: error.message
    });
  }
});

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