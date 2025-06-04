import React, { useState } from 'react';

function PostCard({ article }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleLike = () => {
    // TODO: Send like to backend API
    setLiked(!liked);
  };

  const handleBookmark = () => {
    // TODO: Send bookmark to backend API  
    setBookmarked(!bookmarked);
  };

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'amused': return 'text-green-600';
      case 'concerned': return 'text-orange-600';
      case 'motivational': return 'text-blue-600';
      default: return 'text-stone-600';
    }
  };

  const formatTimeAgo = (timestamp) => {
    // TODO: Implement proper time formatting
    return "2h ago";
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
            className={`flex items-center space-x-1 text-xs transition-colors ${
              liked 
                ? 'text-red-600' 
                : 'text-stone-500 hover:text-stone-700'
            }`}
            aria-label={liked ? "Unlike article" : "Like article"}
          >
            <span>{liked ? '♥' : '♡'}</span>
            <span>Like</span>
          </button>

          <button
            onClick={handleBookmark}
            className={`flex items-center space-x-1 text-xs transition-colors ${
              bookmarked 
                ? 'text-blue-600' 
                : 'text-stone-500 hover:text-stone-700'
            }`}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark article"}
          >
            <span>{bookmarked ? '★' : '☆'}</span>
            <span>Save</span>
          </button>
        </div>

        <button className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
          View Sources
        </button>
      </footer>
    </article>
  );
}

export default PostCard; 