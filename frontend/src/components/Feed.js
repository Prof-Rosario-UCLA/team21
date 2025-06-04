import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';

function Feed() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Fetch trend articles from backend API
    // TODO: Implement real-time updates with Socket.io
    
    // Mock trend data for now
    setTimeout(() => {
      setArticles([
        {
          id: 1,
          headline: "Rise of the Gluttonous Squirrels",
          summary: "Campus squirrels have apparently organized into a sophisticated food-snatching operation. Students report increasingly bold tactics including coordinated backpack raids and strategic positioning near food trucks.",
          trend: "squirrel-takeover",
          relatedPosts: 12,
          sentiment: "amused",
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          headline: "Yall R Mad Depressed",
          summary: "A concerning uptick in posts about academic burnout, midterm stress, and general existential dread. The collective UCLA mood has taken a notable downturn this week.",
          trend: "mental-health-crisis",
          relatedPosts: 8,
          sentiment: "concerned",
          timestamp: new Date().toISOString()
        },
        {
          id: 3,
          headline: "Lonely AF Go Touch Some Grass",
          summary: "Students are increasingly posting about feeling isolated and spending too much time indoors. Time to rediscover the outdoors, Bruins.",
          trend: "social-isolation",
          relatedPosts: 15,
          sentiment: "motivational",
          timestamp: new Date().toISOString()
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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
            onClick={() => window.location.reload()}
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
                <PostCard key={article.id} article={article} />
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