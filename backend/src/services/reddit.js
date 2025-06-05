const { exec } = require('child_process');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class RedditService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../../python/reddit_scraper.py');
  }

  async fetchNewPosts(lastTimestamp = null) {
    try {
      const command = lastTimestamp 
        ? `python3 ${this.pythonScriptPath} ${lastTimestamp}`
        : `python3 ${this.pythonScriptPath}`;

      console.log(`Executing: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 second timeout
        env: { ...process.env }
      });

      if (stderr) {
        console.warn('Python script stderr:', stderr);
      }

      const result = JSON.parse(stdout);
      
      if (!result.success) {
        throw new Error(`Python script failed: ${result.error}`);
      }

      console.log(`Fetched ${result.count} new posts from Reddit`);
      
      return {
        posts: result.posts,
        count: result.count,
        scrapedAt: result.scraped_at
      };

    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Reddit scraping timed out');
      }
      
      if (error.message.includes('SyntaxError') || error.message.includes('JSON')) {
        throw new Error('Invalid response from Reddit scraper');
      }
      
      throw error;
    }
  }

  async testConnection() {
    try {
      // Fetch just a few posts to test the connection
      const result = await this.fetchNewPosts(null);
      return {
        success: true,
        message: `Successfully connected to Reddit. Fetched ${result.count} posts.`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to Reddit: ${error.message}`
      };
    }
  }

  filterValidPosts(posts) {
    return posts.filter(post => {
      // Filter out deleted posts, spam, etc.
      if (!post.title || post.title === '[deleted]') return false;
      if (post.author === '[deleted]') return false;
      if (post.score < 10) return false; // Only posts with 10+ upvotes
      
      return true;
    });
  }

  calculateEngagementScore(post) {
    // Engagement score: upvotes + comment bonus
    const upvoteWeight = 1;
    const commentWeight = 2; // Comments are worth more than upvotes
    
    return (post.score * upvoteWeight) + (post.num_comments * commentWeight);
  }

  sortPostsByEngagement(posts) {
    return posts
      .map(post => ({
        ...post,
        engagement_score: this.calculateEngagementScore(post)
      }))
      .sort((a, b) => b.engagement_score - a.engagement_score);
  }
}

module.exports = new RedditService(); 