const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  async identifyArticleOpportunities(posts) {
    const prompt = `
You are a witty trend analyst for UCLA's Reddit community. Analyze these high-engagement r/ucla posts and decide which ones deserve funny news articles.

OPTIONS:
1. Single viral post articles (one post with lots of engagement)
2. Multi-post trend articles (group of related posts)
3. Skip posts that aren't article-worthy

POSTS DATA (sorted by engagement):
${posts.map(post => `
ID: ${post.id}
Title: ${post.title}
Content: ${post.selftext || '[No content]'}
Score: ${post.score} upvotes
Comments: ${post.num_comments}
Engagement Score: ${post.engagement_score}
Top Comments: ${post.top_comments.slice(0, 3).map(c => c.body).join(' | ') || '[No comments]'}
---
`).join('')}`;

    const schema = {
      type: "object",
      properties: {
        articles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["single", "trend"]
              },
              theme: {
                type: "string",
                description: "Brief description of what makes this article-worthy"
              },
              post_ids: {
                type: "array",
                items: {
                  type: "string"
                }
              },
              justification: {
                type: "string",
                description: "Why this deserves an article"
              },
              humor_potential: {
                type: "string",
                enum: ["high", "medium", "low"]
              }
            },
            required: ["type", "theme", "post_ids", "justification", "humor_potential"]
          }
        }
      },
      required: ["articles"]
    };

    try {
      const response = await this.callGeminiStructured(prompt, schema);
      return this.parseArticleOpportunities(response);
    } catch (error) {
      console.error('Error identifying article opportunities:', error);
      throw error;
    }
  }

  async generateArticle(articleOpportunity, posts) {
    const relevantPosts = posts.filter(post => articleOpportunity.post_ids.includes(post.id));
    const isViralPost = articleOpportunity.type === 'single';
    
    const prompt = `
You are a witty UCLA news writer creating funny articles for the campus community. Write about this ${isViralPost ? 'viral post' : 'trending topic'} with Gen Z humor and UCLA-specific references.

ARTICLE TYPE: ${articleOpportunity.type}
THEME: ${articleOpportunity.theme}
JUSTIFICATION: ${articleOpportunity.justification}

POST DATA:
${relevantPosts.map(post => `
Title: ${post.title}
Content: ${post.selftext || '[No content]'}
Score: ${post.score} upvotes | Comments: ${post.num_comments} | Engagement: ${post.engagement_score}
Top Comments: ${post.top_comments.slice(0, 3).map(c => c.body).join(' | ') || '[No comments]'}
Permalink: ${post.permalink}
---
`).join('')}

WRITING STYLE:
- Gen Z humor with UCLA references (Westwood, Powell Cat, dining halls, etc.)
- Appropriate slang that resonates with college students
- Light and entertaining, not mean-spirited
- ${isViralPost ? 'Focus on this one viral moment and why it captured attention' : 'Connect the trending posts into a cohesive narrative'}`;

    const schema = {
      type: "object",
      properties: {
        headline: {
          type: "string",
          description: `Catchy headline that captures the ${isViralPost ? 'viral moment' : 'trend'}`
        },
        description: {
          type: "string",
          description: "Brief description (1-2 sentences) referencing the posts"
        },
        content: {
          type: "string",
          description: "Full article (200-400 words) with UCLA humor and specific references"
        },
        sentiment: {
          type: "string",
          enum: ["positive", "negative", "neutral", "mixed"]
        },
        tags: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Relevant tags"
        },
        trend_category: {
          type: "string",
          description: "The main theme or category"
        },
        article_type: {
          type: "string",
          enum: ["single", "trend"]
        }
      },
      required: ["headline", "description", "content", "sentiment", "tags", "trend_category", "article_type"]
    };

    try {
      const response = await this.callGeminiStructured(prompt, schema);
      return this.parseArticleResponse(response);
    } catch (error) {
      console.error('Error generating article:', error);
      throw error;
    }
  }

  async callGemini(prompt) {
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    const response = await axios.post(
      `${this.baseUrl}?key=${this.apiKey}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    if (!response.data.candidates || response.data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    return response.data.candidates[0].content.parts[0].text;
  }

  async callGeminiStructured(prompt, schema) {
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    };

    const response = await axios.post(
      `${this.baseUrl}?key=${this.apiKey}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    if (!response.data.candidates || response.data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    // With structured output, the response should be valid JSON
    const responseText = response.data.candidates[0].content.parts[0].text;
    return JSON.parse(responseText);
  }

  parseArticleOpportunities(response) {
    try {
      // With structured output, response is already parsed JSON
      if (!response.articles || !Array.isArray(response.articles)) {
        throw new Error('Invalid article opportunities response format');
      }
      
      return response.articles.filter(article => 
        article.post_ids && 
        article.post_ids.length > 0 && 
        article.humor_potential !== 'low'
      );
    } catch (error) {
      console.error('Error parsing article opportunities response:', error);
      console.error('Response:', response);
      throw new Error('Failed to parse article opportunities');
    }
  }

  parseArticleResponse(response) {
    try {
      // With structured output, response is already parsed JSON
      const required = ['headline', 'description', 'content', 'sentiment', 'tags', 'trend_category'];
      for (const field of required) {
        if (!response[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error parsing article response:', error);
      console.error('Response:', response);
      throw new Error('Failed to parse article generation results');
    }
  }

  async testConnection() {
    try {
      const testPrompt = "Respond with a test message";
      const testSchema = {
        type: "object",
        properties: {
          test: {
            type: "string"
          }
        },
        required: ["test"]
      };
      
      const response = await this.callGeminiStructured(testPrompt, testSchema);
      
      if (response.test) {
        return {
          success: true,
          message: 'Successfully connected to Gemini API with structured output'
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to Gemini API: ${error.message}`
      };
    }
  }
}

module.exports = new GeminiService(); 