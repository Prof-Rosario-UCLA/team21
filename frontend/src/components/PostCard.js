import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function PostCard({ article }) {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
      case 'discussion': return 'bg-blue-100 text-blue-800';
      case 'question': return 'bg-purple-100 text-purple-800';
      case 'announcement': return 'bg-yellow-100 text-yellow-800';
      case 'experience': return 'bg-green-100 text-green-800';
      case 'advice': return 'bg-orange-100 text-orange-800';
      case 'resource': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getArticleTimestamp = () => {
    return article.generated_at || article.createdAt || article.updatedAt || new Date();
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <article 
      className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 ${expanded ? 'shadow-lg' : 'shadow-sm'}`}
      onClick={toggleExpand}
    >
      <header className="mb-4">
        <h2 className="text-xl font-bold text-stone-900 mb-3 leading-tight">
          {article.headline}
        </h2>
        <div className="flex items-center text-xs space-x-4">
          <span className={`px-2 py-1 rounded-full font-medium ${getSentimentColor(article.sentiment)}`}>
            {article.sentiment}
          </span>
          <span className="text-stone-500">{article.referenced_posts?.length || 0} related posts</span>
          <span className="text-stone-500">{formatTimeAgo(getArticleTimestamp())}</span>
        </div>
      </header>

      <section className="mb-5">
        {expanded ? (
          <div className="prose prose-stone max-w-none">
            <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
              {article.content}
            </p>
          </div>
        ) : (
          <p className="text-stone-700 leading-relaxed">
            {article.description}
          </p>
        )}
      </section>

      <footer className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              handleBookmark();
            }}
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
          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            {article.referenced_posts.map((post, index) => (
              <a 
                key={post.post_id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
              >
                {article.referenced_posts.length === 1 ? 'Reddit Post' : `Reddit Post ${index + 1}`}
              </a>
            ))}
          </div>
        )}
      </footer>
    </article>
  );
}

export default PostCard; 