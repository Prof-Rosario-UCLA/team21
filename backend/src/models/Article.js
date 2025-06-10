const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  trend_category: {
    type: String,
    required: true
  },
  referenced_posts: [{
    post_id: String,
    title: String,
    permalink: String,
    score: Number,
    created_utc: Number
  }],
  post_count: {
    type: Number,
    required: true
  },
  sentiment: {
    type: String,
    enum: ['discussion', 'question', 'announcement', 'experience', 'advice', 'resource'],
    default: 'discussion'
  },
  tags: [String],
  generated_at: {
    type: Date,
    default: Date.now
  },
  is_published: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

articleSchema.index({ generated_at: -1 });
articleSchema.index({ trend_category: 1 });
articleSchema.index({ tags: 1 });

module.exports = mongoose.model('Article', articleSchema); 