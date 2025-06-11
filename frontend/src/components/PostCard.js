import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CommentSection from './CommentSection';

function PostCard({ article }) {
  const { isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const getSentimentColor = (sentiment) => {
    switch(sentiment.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'mixed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleCommentCountChange = (newCount) => {
    setCommentCount(newCount);
  };

  return (
    <article 
      className={`bg-orange-50/20 border-2 border-orange-100 rounded-lg p-6 hover:shadow-lg transition-all duration-200 ${expanded ? 'shadow-lg border-orange-300' : 'shadow-sm'}`}
      onClick={toggleExpand}
    >
      <header className="mb-4">
        <h2 className="text-xl font-bold text-stone-900 mb-3 leading-tight">
          {article.headline}
        </h2>
        <div className="flex items-center text-xs space-x-4">
          <span className={`px-2 py-1 rounded-full font-medium border ${getSentimentColor(article.sentiment)}`}>
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

      <footer className="flex items-center justify-between pt-4 border-t border-orange-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className={`flex items-center space-x-1 text-xs transition-colors ${
              showComments 
                ? 'text-blue-600' 
                : 'text-stone-500 hover:text-stone-700'
            }`}
            aria-label={showComments ? "Hide comments" : "Show comments"}
          >
            <span>{showComments ? 'Hide Comments' : `Comments (${commentCount})`}</span>
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
                className="text-xs px-2 py-1 bg-orange-100/60 text-orange-700 hover:bg-orange-100 rounded transition-colors"
              >
                {article.referenced_posts.length === 1 ? 'Reddit Post' : `Reddit Post ${index + 1}`}
              </a>
            ))}
          </div>
        )}
      </footer>

      {/* Comment Section */}
      <CommentSection 
        articleId={article._id}
        isVisible={showComments}
        onClose={() => setShowComments(false)}
        onCommentCountChange={handleCommentCountChange}
      />
    </article>
  );
}

export default PostCard; 