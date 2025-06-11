const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text'
  },
  content: {
    type: String,
    required: function() {
      return this.type === 'text';
    }
  },
  // Voice comment fields
  audioData: {
    type: String, // Base64 encoded audio
    required: function() {
      return this.type === 'voice';
    }
  },
  audioDuration: {
    type: Number, // Duration in seconds
    required: function() {
      return this.type === 'voice';
    }
  },
  audioFormat: {
    type: String,
    default: 'webm'
  },
  profilePicture: String
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Populate author when querying
commentSchema.pre(/^find/, function() {
  this.populate('author', 'name email profilePicture');
});

module.exports = mongoose.model('Comment', commentSchema); 