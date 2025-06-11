import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import VoiceRecorder from './VoiceRecorder';

function CommentSection({ articleId, isVisible, onClose, onCommentCountChange }) {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState(null);
  const [commentType, setCommentType] = useState('text'); // 'text' or 'voice'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingData, setRecordingData] = useState(null);

  useEffect(() => {
    if (isVisible && articleId) {
      fetchComments();
    }
  }, [isVisible, articleId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getComments(articleId);
      const fetchedComments = response.comments || [];
      setComments(fetchedComments);
      // Notify parent of comment count
      if (onCommentCountChange) {
        onCommentCountChange(fetchedComments.length);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('You must be logged in to comment');
      return;
    }

    // Validate based on comment type
    if (commentType === 'text' && !newComment.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (commentType === 'voice') {
      if (!recordingData) {
        setError('Please record a voice message');
        return;
      }
      
      if (!recordingData.audioData) {
        setError('Recording failed - no audio data available');
        return;
      }
      
      if (!recordingData.duration || recordingData.duration <= 0 || isNaN(recordingData.duration)) {
        setError('Recording failed - invalid duration');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const commentData = {
        type: commentType
      };

      if (commentType === 'text') {
        commentData.content = newComment.trim();
      } else if (commentType === 'voice') {
        commentData.audioData = recordingData.audioData;
        commentData.audioDuration = recordingData.duration;
        commentData.audioFormat = 'webm'; // Using original WebM format
      }
      
      const response = await api.createComment(articleId, commentData);
      
      // Add the new comment to the beginning of the list
      const updatedComments = [response.comment, ...comments];
      setComments(updatedComments);
      // Notify parent of new comment count
      if (onCommentCountChange) {
        onCommentCountChange(updatedComments.length);
      }
      
      setNewComment('');
      setRecordingData(null);
      setIsRecording(false);
    } catch (error) {
      console.error('Error creating comment:', error);
      setError(error.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stopping recording - don't clear data yet, wait for completion
      setIsRecording(false);
    } else {
      // Starting new recording - clear any existing data
      setRecordingData(null);
      setError(null);
      setIsRecording(true);
    }
  };

  const handleRecordingComplete = (data) => {
    console.log('Recording completed:', data);
    setRecordingData(data);
    setIsRecording(false);
    
    // Validate the recorded data
    if (!data.audioData) {
      setError('Recording failed - no audio data captured');
      return;
    }
    
    if (!data.duration || data.duration <= 0 || isNaN(data.duration)) {
      setError('Recording failed - invalid duration captured');
      return;
    }
    
    // Clear any previous errors
    setError(null);
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  const getInitialsColor = (name) => {
    const colors = [
      'bg-red-100 text-red-600',
      'bg-blue-100 text-blue-600', 
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-yellow-100 text-yellow-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
      'bg-teal-100 text-teal-600'
    ];
    
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds <= 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!isVisible) return null;

  return (
    <section 
      className="mt-6 pt-6 border-t border-orange-100" 
      aria-label="Comments section"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-stone-900">
          Comments ({comments.length})
        </h3>
        <button
          onClick={onClose}
          className="text-stone-500 hover:text-stone-700 transition-colors"
          aria-label="Close comments"
        >
          ✕
        </button>
      </div>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          {/* Comment Type Toggle */}
          <div className="flex items-center space-x-4 mb-3">
            <span className="text-sm font-medium text-stone-700">Comment type:</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setCommentType('text');
                  setRecordingData(null);
                  setIsRecording(false);
                  setError(null);
                }}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  commentType === 'text'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommentType('voice');
                  setNewComment('');
                  setError(null);
                }}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  commentType === 'voice'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Voice
              </button>
            </div>
          </div>

          {/* Text Input */}
          {commentType === 'text' && (
            <div className="mb-3">
              <label htmlFor="comment-input" className="sr-only">
                Write a comment
              </label>
              <textarea
                id="comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-3 border-2 border-orange-200 rounded-lg bg-orange-50/20 focus:border-orange-300 focus:outline-none resize-none"
                rows={3}
                maxLength={1000}
                disabled={submitting}
              />
              <div className="text-xs text-stone-500 mt-1">
                {newComment.length}/1000 characters
              </div>
            </div>
          )}

          {/* Voice Recorder */}
          {commentType === 'voice' && (
            <div className="mb-3">
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                isRecording={isRecording}
                onToggleRecording={handleToggleRecording}
              />
              {recordingData && recordingData.audioData && recordingData.duration > 0 && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="text-sm text-green-800 font-medium">
                    ✓ Voice recording ready ({formatDuration(recordingData.duration)})
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    WebM audio format ({formatFileSize(recordingData.audioSize)})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRecordingData(null);
                      setError(null);
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Delete recording
                  </button>
                </div>
              )}
              {isRecording && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  Recording in progress... Click the stop button when finished.
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={submitting || (commentType === 'text' && !newComment.trim()) || (commentType === 'voice' && !recordingData)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              submitting || (commentType === 'text' && !newComment.trim()) || (commentType === 'voice' && !recordingData)
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {submitting ? 'Posting...' : `Post ${commentType === 'voice' ? 'Voice' : 'Text'} Comment`}
          </button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-orange-50/40 border border-orange-200 rounded-lg text-center">
          <p className="text-stone-600">
            You must be logged in to post comments.
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-stone-600">Loading comments...</p>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <article
              key={comment._id}
              className="p-4 bg-orange-50/10 border border-orange-100 rounded-lg"
            >
              <header className="flex items-center space-x-3 mb-2">
                {/* Profile Picture */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-orange-200 ${
                  comment.author.profilePicture ? 'bg-white' : getInitialsColor(comment.author.name)
                }`}>
                  {comment.author.profilePicture ? (
                    <img 
                      src={comment.author.profilePicture} 
                      alt={comment.author.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-stone-900">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-stone-500">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                    {comment.type === 'voice' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Voice
                      </span>
                    )}
                  </div>
                </div>
              </header>
              
              {/* Comment Content */}
              {comment.type === 'text' ? (
                <p className="text-stone-700 whitespace-pre-wrap">
                  {comment.content}
                </p>
              ) : (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <audio 
                    controls 
                    className="w-full"
                    preload="none"
                  >
                    <source 
                      src={`data:audio/${comment.audioFormat || 'webm'};base64,${comment.audioData}`} 
                      type={`audio/${comment.audioFormat || 'webm'}`} 
                    />
                    Your browser does not support audio playback.
                  </audio>
                  <div className="text-xs text-purple-600 mt-1">
                    <span>Duration: {formatDuration(comment.audioDuration)}</span>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-stone-500">
          No comments yet. Be the first to comment!
        </div>
      )}
    </section>
  );
}

export default CommentSection; 