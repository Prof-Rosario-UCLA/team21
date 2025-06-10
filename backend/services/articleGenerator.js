const Article = require('../models/Article');
const axios = require('axios');

const SUBREDDITS = [
  'ucla',
  'uclabruins',
  'uclahousing',
  'uclaclassof2027',
  'uclaclassof2026',
  'uclaclassof2025',
  'uclaclassof2024'
];

async function generateArticles() {
  try {
    const articles = [];
    
    for (const subreddit of SUBREDDITS) {
      const response = await axios.get(
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
        {
          headers: {
            'User-Agent': 'UCLA Reddit Summarizer v1.0'
          }
        }
      );

      const posts = response.data.data.children;
      
      for (const post of posts) {
        const postData = post.data;
        
        // Skip posts that are too short or are just links
        if (postData.selftext.length < 50 && !postData.title.includes('?')) continue;
        
        // Analyze sentiment (simplified version - you might want to use a proper NLP service)
        const sentiment = analyzeSentiment(postData.title + ' ' + postData.selftext);
        
        // Categorize the trend
        const trend = categorizeTrend(postData.title, postData.link_flair_text);
        
        const article = new Article({
          title: postData.title,
          content: postData.selftext,
          url: `https://reddit.com${postData.permalink}`,
          sentiment,
          trend_category: trend,
          post_count: 1,
          description: generateSummary(postData.title, postData.selftext),
          generated_at: new Date(),
          likes: [],
          bookmarks: []
        });

        await article.save();
        articles.push(article);
      }
    }

    return articles;
  } catch (error) {
    console.error('Error generating articles:', error);
    throw error;
  }
}

function analyzeSentiment(text) {
  // This is a simplified sentiment analysis
  // In production, you'd want to use a proper NLP service
  const positiveWords = ['great', 'good', 'awesome', 'amazing', 'love', 'happy', 'excited', 'thank', 'thanks', 'helpful', 'perfect', 'best'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'sad', 'angry', 'worse', 'worst', 'problem', 'issue', 'difficult'];
  
  text = text.toLowerCase();
  let positiveCount = positiveWords.reduce((count, word) => 
    count + (text.match(new RegExp(word, 'g')) || []).length, 0);
  let negativeCount = negativeWords.reduce((count, word) => 
    count + (text.match(new RegExp(word, 'g')) || []).length, 0);
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function categorizeTrend(title, flair) {
  const categories = {
    'Academics': ['class', 'professor', 'grade', 'exam', 'final', 'study', 'major', 'minor', 'course'],
    'Campus Life': ['dorm', 'housing', 'food', 'dining', 'roommate', 'campus', 'library'],
    'Social': ['club', 'friend', 'party', 'event', 'meet', 'social'],
    'Sports': ['game', 'basketball', 'football', 'sport', 'athlete', 'bruins'],
    'Questions': ['question', 'help', 'advice', 'how', 'what', 'when', 'where', 'why'],
    'Discussion': ['discuss', 'opinion', 'thought', 'feel', 'think']
  };

  title = title.toLowerCase();
  flair = (flair || '').toLowerCase();

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => title.includes(keyword) || flair.includes(keyword))) {
      return category;
    }
  }

  return 'General';
}

function generateSummary(title, content) {
  // Simple summary generation - takes first sentence or first 200 characters
  const fullText = title + '. ' + content;
  const firstSentence = fullText.split(/[.!?](\s|$)/)[0];
  
  if (firstSentence.length <= 200) {
    return firstSentence;
  }
  
  return firstSentence.substring(0, 197) + '...';
}

module.exports = {
  generateArticles
}; 