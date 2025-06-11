import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import DailyMoodHeader from './DailyMoodHeader';
import useOnlineStatus from '../hooks/useOnlineStatus';
import api from '../services/api';

function Feed() {
  const [todaysArticles, setTodaysArticles] = useState([]);
  const [pastArticles, setPastArticles] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!hasFetched) {
      fetchData();
    }
  }, [hasFetched]);

  useEffect(() => {
    // Auto-retry when coming back online
    if (isOnline && error && retryCount > 0) {
      console.log('Back online, retrying data fetch...');
      fetchData();
    }
  }, [isOnline, error, retryCount]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [todayResponse, pastResponse] = await Promise.all([
        api.getTodaysArticles(),
        api.getPastArticles()
      ]);
      
      setTodaysArticles(todayResponse.articles);
      setPastArticles(pastResponse.articles);
      setDailySummary(todayResponse.daily_summary);
      setRetryCount(0); // Reset retry count on success
      setHasFetched(true); // Mark as fetched to prevent duplicate calls
    } catch (error) {
      console.error('Error fetching articles:', error);
      
      // Try to parse the error response to see if it's our offline response
      if (error.response && error.response.data && error.response.data.offline) {
        setError({
          type: 'offline',
          message: 'You appear to be offline. Showing cached content if available.'
        });
      } else if (!isOnline || error.message.includes('offline') || error.message.includes('fetch') || error.message.includes('Network Error')) {
        setError({
          type: 'offline',
          message: 'You appear to be offline. Showing cached content if available.'
        });
      } else {
        setError({
          type: 'server',
          message: error.message || 'Unable to load articles. Please try again.'
        });
      }
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setHasFetched(false); // Reset to allow retry
    fetchData();
  };

  if (loading && todaysArticles.length === 0 && pastArticles.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <section className="text-center" aria-live="polite">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-stone-600">
            {isOnline ? 'Analyzing campus trends...' : 'Attempting to fetch data...'}
          </p>
          {!isOnline && (
            <p className="mt-2 text-sm text-orange-600">
              You appear to be offline. Loading cached content if available.
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="w-full bg-orange-50/30 min-h-screen">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
        {/* Offline Banner */}
        {!isOnline && (
          <section className="mb-6 bg-orange-100/70 border border-orange-200 rounded-lg p-4" role="alert">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-orange-800">You're currently offline</h3>
                <p className="text-xs text-orange-700 mt-1">
                  Showing cached content. New articles will load when you're back online.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Error Banner */}
        {error && error.type === 'server' && (
          <section className="mb-6 bg-red-100/70 border border-red-200 rounded-lg p-4" role="alert">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Unable to load latest content</h3>
                  <p className="text-xs text-red-700 mt-1">{error.message}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </section>
        )}

        <DailyMoodHeader dailySummary={dailySummary} />
        
        {/* Today's Articles */}
        {todaysArticles.length > 0 && (
          <section className="space-y-6 mb-8" aria-label="Today's campus trend articles">
            {todaysArticles.map((article) => (
              <PostCard key={article._id} article={article} />
            ))}
          </section>
        )}

        {/* Divider between today's and past articles */}
        {todaysArticles.length > 0 && pastArticles.length > 0 && (
          <div className="flex items-center justify-center my-16">
            <div className="flex items-center w-full max-w-md">
              <div className="flex-1 h-px bg-orange-200"></div>
              <span className="px-4 text-sm font-medium text-stone-500 bg-orange-50/30">
                Past Articles
              </span>
              <div className="flex-1 h-px bg-orange-200"></div>
            </div>
          </div>
        )}

        {/* Past Articles */}
        {pastArticles.length > 0 && (
          <section className="space-y-6 mt-8 mb-12" aria-label="Past campus trend articles">
            {pastArticles.map((article) => (
              <PostCard key={article._id} article={article} />
            ))}
          </section>
        )}
        
        {/* No content message */}
        {todaysArticles.length === 0 && pastArticles.length === 0 && !loading && (
          <div className="text-center py-12">
            {error ? (
              <div className="text-stone-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.563M15 9a6 6 0 11-6 0 6 6 0 016 0z" />
                </svg>
                <p className="text-lg font-medium mb-2">
                  {!isOnline ? 'No cached content available' : 'Unable to load content'}
                </p>
                <p className="text-sm">
                  {!isOnline 
                    ? 'Please check your internet connection and try again.'
                    : 'Please try refreshing the page or check back later.'}
                </p>
                {isOnline && (
                  <button
                    onClick={handleRetry}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            ) : (
              <div className="text-stone-500">
                No trends detected. The campus is suspiciously quiet...
              </div>
            )}
          </div>
        )}

        {/* Loading more indicator when already have content */}
        {loading && (todaysArticles.length > 0 || pastArticles.length > 0) && (
          <section className="text-center py-8" aria-live="polite">
            <div className="inline-flex items-center space-x-2 text-stone-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">
                {isOnline ? 'Loading latest trends...' : 'Attempting to fetch data...'}
              </span>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default Feed; 