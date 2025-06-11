import React from 'react';

function DailyMoodHeader({ dailySummary }) {
  if (!dailySummary) {
    return (
      <div className="text-center py-8 bg-orange-50/30 rounded-lg mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-3"></div>
          <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-80 mx-auto"></div>
        </div>
      </div>
    );
  }

  const formatDate = () => {
    const today = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
  };

  const getSummaryDate = () => {
    if (dailySummary && dailySummary.date) {
      const summaryDate = new Date(dailySummary.date + 'T00:00:00');
      const today = new Date();
      const todayStr = today.toLocaleDateString('en-CA', {
        timeZone: 'America/Los_Angeles'
      });
      
      if (dailySummary.date === todayStr) {
        return null; // Don't show date indicator for today
      }
      
      const options = { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      };
      return summaryDate.toLocaleDateString('en-US', options);
    }
    return null;
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-800';
      case 'negative':
        return 'text-red-800';
      case 'neutral':
        return 'text-gray-800';
      case 'mixed':
        return 'text-yellow-800';
      default:
        return 'text-stone-800';
    }
  };

  return (
    <header className="text-center py-8 bg-orange-50/30 rounded-lg mb-6">
      <div className="max-w-2xl mx-auto px-4">
        <time className="text-sm text-stone-600 font-medium block mb-3">
          {getSummaryDate() ? `Latest mood from ${getSummaryDate()}` : formatDate()}
        </time>
        
        <div className="flex items-center justify-center space-x-3 mb-3">
          <span className="text-3xl" role="img" aria-label="Campus mood">
            {dailySummary.mood_emoji}
          </span>
          <h1 className={`text-2xl font-bold ${getSentimentColor(dailySummary.overall_sentiment)}`}>
            r/UCLA is feeling: {dailySummary.mood_title}
          </h1>
        </div>
        
        <p className="text-stone-700 text-lg leading-relaxed italic">
          "{dailySummary.mood_description}"
        </p>
        
        <div className="mt-4 text-xs text-stone-500">
          Based on {dailySummary.article_count} trending {dailySummary.article_count === 1 ? 'story' : 'stories'}
          {getSummaryDate() && (
            <span className="block mt-1 text-orange-600">
              📅 No fresh mood today - showing recent campus vibe
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

export default DailyMoodHeader; 