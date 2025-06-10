const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const auth = require('../middleware/auth');
const { generateArticles } = require('../services/articleGenerator');

// Get today's articles
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const articles = await Article.find({
      generated_at: { $gte: today }
    }).sort({ generated_at: -1 });

    res.json({
      articles,
      daily_summary: articles.length > 0 ? {
        sentiment: calculateDailySentiment(articles),
        topTrends: getTopTrends(articles)
      } : null
    });
  } catch (error) {
    console.error('Error fetching today\'s articles:', error);
    res.status(500).json({ message: 'Error fetching articles' });
  }
});

// Get past articles
router.get('/past', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const articles = await Article.find({
      generated_at: { $lt: today }
    }).sort({ generated_at: -1 });

    res.json({ articles });
  } catch (error) {
    console.error('Error fetching past articles:', error);
    res.status(500).json({ message: 'Error fetching articles' });
  }
});

// Generate new articles
router.post('/generate', async (req, res) => {
  try {
    const articles = await generateArticles();
    res.json({ message: 'Articles generation started', count: articles.length });
  } catch (error) {
    console.error('Error generating articles:', error);
    res.status(500).json({ message: 'Error generating articles' });
  }
});

// Toggle like on article
router.post('/:id/like', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const userLikeIndex = article.likes.indexOf(req.user.id);
    if (userLikeIndex === -1) {
      article.likes.push(req.user.id);
    } else {
      article.likes.splice(userLikeIndex, 1);
    }

    await article.save();
    res.json({ liked: userLikeIndex === -1 });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Error toggling like' });
  }
});

// Toggle bookmark on article
router.post('/:id/bookmark', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const userBookmarkIndex = article.bookmarks.indexOf(req.user.id);
    if (userBookmarkIndex === -1) {
      article.bookmarks.push(req.user.id);
    } else {
      article.bookmarks.splice(userBookmarkIndex, 1);
    }

    await article.save();
    res.json({ bookmarked: userBookmarkIndex === -1 });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ message: 'Error toggling bookmark' });
  }
});

// Helper functions
function calculateDailySentiment(articles) {
  const sentimentCounts = articles.reduce((acc, article) => {
    acc[article.sentiment] = (acc[article.sentiment] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(sentimentCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
}

function getTopTrends(articles) {
  const trendCounts = articles.reduce((acc, article) => {
    acc[article.trend_category] = (acc[article.trend_category] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(trendCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trend]) => trend);
}

module.exports = router; 