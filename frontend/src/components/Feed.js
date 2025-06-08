import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import DailyMoodHeader from './DailyMoodHeader';
import api from '../services/api';

function Feed() {
  const [todaysArticles, setTodaysArticles] = useState([]);
  const [pastArticles, setPastArticles] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [todayResponse, pastResponse] = await Promise.all([
        api.getTodaysArticles(),
        api.getPastArticles()
      ]);
      
      setTodaysArticles(todayResponse.articles);
      setDailySummary(todayResponse.daily_summary);
      setPastArticles(pastResponse.articles);
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
            onClick={fetchData}
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
          {/* Daily Mood Header */}
          <DailyMoodHeader dailySummary={dailySummary} />
          
          {/* Today's Articles */}
          {todaysArticles.length > 0 && (
            <div className="space-y-6">
              {todaysArticles.map(article => (
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
              ))}
            </div>
          )}

          {/* Past Articles Separator */}
          {pastArticles.length > 0 && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-orange-50 px-6 py-2 text-sm font-medium text-stone-600 rounded-full border border-gray-200">
                    📚 Past Articles
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {pastArticles.map(article => (
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
                ))}
              </div>
            </>
          )}

          {/* Empty State */}
          {todaysArticles.length === 0 && pastArticles.length === 0 && (
            <div className="text-center py-12 text-stone-500">
              No trends detected. The campus is suspiciously quiet...
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Feed; 