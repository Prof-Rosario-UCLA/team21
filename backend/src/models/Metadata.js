const mongoose = require('mongoose');

const metadataSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

metadataSchema.statics.getLastScrapedTimestamp = async function() {
  const metadata = await this.findOne({ key: 'last_scraped_timestamp' });
  return metadata ? metadata.value : null;
};

metadataSchema.statics.updateLastScrapedTimestamp = async function(timestamp) {
  return await this.findOneAndUpdate(
    { key: 'last_scraped_timestamp' },
    { 
      value: timestamp,
      description: 'Timestamp of last successful Reddit scraping',
      updated_at: new Date()
    },
    { upsert: true, new: true }
  );
};

metadataSchema.statics.getProcessingStats = async function() {
  const stats = await this.findOne({ key: 'processing_stats' });
  return stats ? stats.value : {
    total_posts_processed: 0,
    total_articles_generated: 0,
    last_processing_run: null
  };
};

metadataSchema.statics.updateProcessingStats = async function(stats) {
  return await this.findOneAndUpdate(
    { key: 'processing_stats' },
    { 
      value: stats,
      description: 'Statistics about processing runs',
      updated_at: new Date()
    },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('Metadata', metadataSchema); 