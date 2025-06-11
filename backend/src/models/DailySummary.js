const mongoose = require('mongoose');
const { getPSTDateString } = require('../utils/dateUtils');

const dailySummarySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD format
  },
  mood_emoji: {
    type: String,
    required: true
  },
  mood_title: {
    type: String,
    required: true,
    trim: true
  },
  mood_description: {
    type: String,
    required: true
  },
  overall_sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral', 'mixed'],
    required: true
  },
  article_count: {
    type: Number,
    required: true,
    min: 0
  },
  total_engagement: {
    type: Number,
    default: 0
  },
  referenced_articles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  }],
  generated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

dailySummarySchema.index({ date: -1 });

dailySummarySchema.statics.getTodaysSummary = async function() {
  const today = getPSTDateString();
  return await this.findOne({ date: today }).populate('referenced_articles');
};

dailySummarySchema.statics.getSummaryByDate = async function(date) {
  return await this.findOne({ date }).populate('referenced_articles');
};

module.exports = mongoose.model('DailySummary', dailySummarySchema); 