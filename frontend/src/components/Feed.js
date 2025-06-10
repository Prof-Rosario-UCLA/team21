import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import DailyMoodHeader from './DailyMoodHeader';
import api from '../services/api';

function Feed() {
  const [articles, setArticles] = useState([]);
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
      
      // Combine today's and past articles into a single array
      const allArticles = [...todayResponse.articles, ...pastResponse.articles];
      
      setArticles(allArticles);
      setDailySummary(todayResponse.daily_summary);
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
      <main className="min-h-screen flex items-center justify-center">
        <section className="text-center" aria-live="polite">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-stone-600">Analyzing campus trends...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <section className="text-center" role="alert">
          <p className="text-red-600">Error loading articles: {error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 text-blue-600 hover:text-blue-700 underline"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="w-full">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
        <DailyMoodHeader dailySummary={dailySummary} />
        
        <section className="space-y-6" aria-label="Campus trend articles">
          {articles.map((article) => (
            <PostCard key={article._id} article={article} />
          ))}
          
          {articles.length === 0 && (
            <div className="text-center py-12 text-stone-500">
              No trends detected. The campus is suspiciously quiet...
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Feed; 