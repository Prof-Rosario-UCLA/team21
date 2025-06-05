import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function PostCard({ article }) {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!isAuthenticated) {
      // TODO: Show login modal
      return;
    }

    try {
      setLoading(true);
      await api.likeArticle(article.id);
      setLiked(!liked);
    } catch (error) {
      console.error('Error liking article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      // TODO: Show login modal
      return;
    }

    try {
      setLoading(true);
      await api.bookmarkArticle(article.id);
      setBookmarked(!bookmarked);
    } catch (error) {
      console.error('Error bookmarking article:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch(sentiment.toLowerCase()) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-stone-600';
      case 'mixed': return 'text-orange-600';
      default: return 'text-stone-600';
    }
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

  return (
    <article className="bg-orange-25 border border-orange-200 rounded-lg p-6 hover:bg-orange-50 transition-colors shadow-sm">
      <header className="mb-4">
        <h2 className="text-xl font-bold text-stone-900 mb-3 leading-tight">
          {article.headline}
        </h2>
        <div className="flex items-center text-xs text-stone-500 space-x-4">
          <span className={`font-semibold ${getSentimentColor(article.sentiment)}`}>
            {article.sentiment}
          </span>
          <span>{article.relatedPosts} related posts</span>
          <span>{formatTimeAgo(article.timestamp)}</span>
        </div>
      </header>

      <section className="mb-5">
        <p className="text-stone-700 leading-relaxed">
          {article.summary}
        </p>
      </section>

      <footer className="flex items-center justify-between pt-4 border-t border-orange-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            disabled={loading}
            className={`flex items-center space-x-1 text-xs transition-colors ${
              liked 
                ? 'text-red-600' 
                : 'text-stone-500 hover:text-stone-700'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={liked ? "Unlike article" : "Like article"}
          >
            <span>{liked ? '♥' : '♡'}</span>
            <span>Like</span>
          </button>

          <button
            onClick={handleBookmark}
            disabled={loading}
            className={`flex items-center space-x-1 text-xs transition-colors ${
              bookmarked 
                ? 'text-blue-600' 
                : 'text-stone-500 hover:text-stone-700'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark article"}
          >
            <span>{bookmarked ? '★' : '☆'}</span>
            <span>Save</span>
          </button>
        </div>

        {article.referenced_posts && article.referenced_posts.length > 0 && (
          <a 
            href={`https://reddit.com${article.referenced_posts[0].permalink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
          >
            View on Reddit
          </a>
        )}
      </footer>
    </article>
  );
}

export default PostCard; 