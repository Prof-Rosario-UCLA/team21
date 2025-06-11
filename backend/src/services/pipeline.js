const redditService = require('./reddit');
const geminiService = require('./gemini');
const Article = require('../models/Article');
const Metadata = require('../models/Metadata');
const DailySummary = require('../models/DailySummary');
const { getPSTDateString, getPSTStartOfDay, getPSTEndOfDay } = require('../utils/dateUtils');

class PipelineService {
  constructor() {
    this.maxPostsPerBatch = parseInt(process.env.MAX_POSTS_PER_BATCH) || 100;
  }

  async runFullPipeline() {
    const startTime = Date.now();
    console.log('Starting Reddit news generation pipeline...');

    try {
      // Get last processed timestamp
      const lastTimestamp = await Metadata.getLastScrapedTimestamp();
      console.log(`Last scraped timestamp: ${lastTimestamp ? new Date(lastTimestamp * 1000).toISOString() : 'None (first run)'}`);

      // Fetch new posts from Reddit
      const redditResult = await redditService.fetchNewPosts(lastTimestamp);
      
      if (redditResult.count === 0) {
        console.log('No new posts found');
        return {
          success: true,
          message: 'No new posts to process',
          articlesGenerated: 0,
          postsProcessed: 0
        };
      }

      console.log(`Fetched ${redditResult.count} new posts`);

      // Filter and validate posts
      const validPosts = redditService.filterValidPosts(redditResult.posts);
      console.log(`${validPosts.length} valid posts after filtering (10+ upvotes)`);

      if (validPosts.length === 0) {
        console.log('No high-engagement posts found');
        await Metadata.updateLastScrapedTimestamp(redditResult.scrapedAt);
        
        return {
          success: true,
          message: 'No high-engagement posts to process',
          articlesGenerated: 0,
          postsProcessed: 0
        };
      }

      // Sort posts by engagement and identify article opportunities
      const sortedPosts = redditService.sortPostsByEngagement(validPosts);
      console.log('Identifying article opportunities with Gemini AI...');
      
      const articleOpportunities = await geminiService.identifyArticleOpportunities(sortedPosts);
      console.log(`Identified ${articleOpportunities.length} article opportunities`);

      if (articleOpportunities.length === 0) {
        console.log('No article-worthy content found');
        await Metadata.updateLastScrapedTimestamp(redditResult.scrapedAt);
        
        return {
          success: true,
          message: 'No article-worthy content identified',
          articlesGenerated: 0,
          postsProcessed: validPosts.length
        };
      }

      // Generate articles and daily summary in one API call
      const generatedArticles = [];
      const today = getPSTDateString();
      let dailySummary = null;
      
      if (articleOpportunities.length > 0) {
        try {
          console.log(`Generating ${articleOpportunities.length} articles with daily summary...`);
          
          const result = await geminiService.generateArticlesWithDailySummary(articleOpportunities, sortedPosts, today);
          
          // Process each generated article
          for (let i = 0; i < result.articles.length && i < articleOpportunities.length; i++) {
            try {
              const articleData = result.articles[i];
              const opportunity = articleOpportunities[i];
              const relevantPosts = sortedPosts.filter(post => opportunity.post_ids.includes(post.id));
              
              // Create and save article
              const article = new Article({
                headline: articleData.headline,
                description: articleData.description,
                content: articleData.content,
                trend_category: articleData.trend_category,
                referenced_posts: relevantPosts.map(post => ({
                  post_id: post.id,
                  title: post.title,
                  permalink: post.permalink,
                  score: post.score,
                  created_utc: post.created_utc
                })),
                post_count: relevantPosts.length,
                sentiment: articleData.sentiment,
                tags: articleData.tags || []
              });

              await article.save();
              generatedArticles.push(article);
              
              console.log(`Generated article: "${articleData.headline}"`);
              
            } catch (error) {
              console.error(`Error saving article ${i}:`, error);
            }
          }
          
          // Save daily summary
          if (result.daily_summary && generatedArticles.length > 0) {
            try {
              console.log('Saving daily mood summary...');
              
              // Calculate total engagement
              const totalEngagement = generatedArticles.reduce((sum, article) => {
                return sum + (article.referenced_posts?.reduce((postSum, post) => postSum + post.score, 0) || 0);
              }, 0);
              
              dailySummary = await DailySummary.findOneAndUpdate(
                { date: today },
                {
                  mood_emoji: result.daily_summary.mood_emoji,
                  mood_title: result.daily_summary.mood_title,
                  mood_description: result.daily_summary.mood_description,
                  overall_sentiment: result.daily_summary.overall_sentiment,
                  article_count: generatedArticles.length,
                  total_engagement: totalEngagement,
                  referenced_articles: generatedArticles.map(article => article._id)
                },
                { upsert: true, new: true }
              );
              
              console.log(`Generated daily summary: ${result.daily_summary.mood_emoji} ${result.daily_summary.mood_title}`);
            } catch (error) {
              console.error('Error saving daily summary:', error);
            }
          }
          
        } catch (error) {
          console.error('Error generating articles with daily summary:', error);
        }
      }

      // Update metadata
      await Metadata.updateLastScrapedTimestamp(redditResult.scrapedAt);
      
      const stats = await Metadata.getProcessingStats();
      await Metadata.updateProcessingStats({
        total_posts_processed: stats.total_posts_processed + validPosts.length,
        total_articles_generated: stats.total_articles_generated + generatedArticles.length,
        last_processing_run: new Date().toISOString()
      });

      const duration = Date.now() - startTime;
      console.log(`Pipeline completed in ${duration}ms. Generated ${generatedArticles.length} articles.`);

      return {
        success: true,
        message: `Successfully generated ${generatedArticles.length} articles from ${validPosts.length} posts`,
        articlesGenerated: generatedArticles.length,
        postsProcessed: validPosts.length,
        opportunities: articleOpportunities.length,
        duration: duration,
        daily_summary: dailySummary ? {
          mood: `${dailySummary.mood_emoji} ${dailySummary.mood_title}`,
          description: dailySummary.mood_description
        } : null,
        articles: generatedArticles.map(article => ({
          id: article._id,
          headline: article.headline,
          trend_category: article.trend_category,
          post_count: article.post_count
        }))
      };

    } catch (error) {
      console.error('Pipeline error:', error);
      
      return {
        success: false,
        message: `Pipeline failed: ${error.message}`,
        articlesGenerated: 0,
        postsProcessed: 0,
        error: error.message
      };
    }
  }

  async getRecentArticles(limit = 10) {
    try {
      const articles = await Article.find({ is_published: true })
        .sort({ generated_at: -1 })
        .limit(limit)
        .select('headline description trend_category sentiment tags generated_at post_count');
      
      return articles;
    } catch (error) {
      console.error('Error fetching recent articles:', error);
      throw error;
    }
  }

  async getTodaysArticles() {
    try {
      const startOfDay = getPSTStartOfDay();
      const endOfDay = getPSTEndOfDay();
      
      const articles = await Article.find({
        is_published: true,
        generated_at: { $gte: startOfDay, $lt: endOfDay }
      }).sort({ generated_at: -1 });
      
      return articles;
    } catch (error) {
      console.error('Error fetching today\'s articles:', error);
      throw error;
    }
  }

  async getPastArticles() {
    try {
      const startOfDay = getPSTStartOfDay();
      
      const articles = await Article.find({
        is_published: true,
        generated_at: { $lt: startOfDay }
      }).sort({ generated_at: -1 });
      
      return articles;
    } catch (error) {
      console.error('Error fetching past articles:', error);
      throw error;
    }
  }

  async getDailySummary(date = null) {
    try {
      if (date) {
        return await DailySummary.getSummaryByDate(date);
      } else {
        // First try to get today's summary
        let summary = await DailySummary.getTodaysSummary();
        
        // If no summary for today, get the most recent summary
        if (!summary) {
          summary = await DailySummary.findOne()
            .sort({ date: -1 })
            .populate('referenced_articles');
        }
        
        return summary;
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      throw error;
    }
  }

  async getArticleById(articleId) {
    try {
      const article = await Article.findById(articleId);
      return article;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  }

  async getSystemStats() {
    try {
      const stats = await Metadata.getProcessingStats();
      const lastTimestamp = await Metadata.getLastScrapedTimestamp();
      const totalArticles = await Article.countDocuments();
      const recentArticles = await Article.countDocuments({
        generated_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      return {
        ...stats,
        total_articles_in_db: totalArticles,
        articles_last_24h: recentArticles,
        last_scraped: lastTimestamp ? new Date(lastTimestamp * 1000).toISOString() : null
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }

  async testAllServices() {
    const results = {};
    
    try {
      results.reddit = await redditService.testConnection();
    } catch (error) {
      results.reddit = { success: false, message: error.message };
    }
    
    try {
      results.gemini = await geminiService.testConnection();
    } catch (error) {
      results.gemini = { success: false, message: error.message };
    }
    
    return results;
  }
}

module.exports = new PipelineService(); 