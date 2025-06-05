import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import api from '../services/api';

function Feed() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await api.getArticles(10);
      setArticles(response.articles);
      setError(null);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <section className="text-center" aria-live="polite">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-stone-600">Analyzing campus trends...</p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <section className="text-center" role="alert">
          <p className="text-red-600">Error loading articles: {error}</p>
          <button 
            onClick={fetchArticles}
            className="mt-4 text-blue-600 hover:text-blue-700 underline"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto hide-scrollbar">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <section className="space-y-8">
          <header className="text-center">
            <h1 className="text-3xl font-bold text-stone-800 mb-4">
              Campus Trends
            </h1>
            <p className="text-stone-600 max-w-2xl mx-auto text-lg leading-relaxed">
              AI-generated insights from the UCLA community zeitgeist
            </p>
          </header>

          <div className="space-y-6">
            {articles.length > 0 ? (
              articles.map(article => (
                <PostCard 
                  key={article._id} 
                  article={{
                    ...article,
                    id: article._id,
                    summary: article.description,
                    trend: article.trend_category,
                    relatedPosts: article.post_count,
                    timestamp: article.generated_at
                  }} 
                />
              ))
            ) : (
              <div className="text-center py-12 text-stone-500">
                No trends detected. The campus is suspiciously quiet...
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Feed; 