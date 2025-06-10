import React from 'react';

function DailyMoodHeader({ dailySummary }) {
  if (!dailySummary) {
    return (
      <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg mb-6">
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

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'discussion':
        return 'text-blue-800';
      case 'question':
        return 'text-purple-800';
      case 'announcement':
        return 'text-yellow-800';
      case 'experience':
        return 'text-green-800';
      case 'advice':
        return 'text-orange-800';
      case 'resource':
        return 'text-teal-800';
      default:
        return 'text-stone-800';
    }
  };

  const getSentimentBg = (sentiment) => {
    switch (sentiment) {
      case 'discussion':
        return 'from-blue-50 to-blue-100';
      case 'question':
        return 'from-purple-50 to-purple-100';
      case 'announcement':
        return 'from-yellow-50 to-yellow-100';
      case 'experience':
        return 'from-green-50 to-green-100';
      case 'advice':
        return 'from-orange-50 to-orange-100';
      case 'resource':
        return 'from-teal-50 to-teal-100';
      default:
        return 'from-stone-50 to-stone-100';
    }
  };

  return (
    <header className={`text-center py-8 bg-gradient-to-r ${getSentimentBg(dailySummary.overall_sentiment)} rounded-lg mb-6 border border-gray-100`}>
      <div className="max-w-2xl mx-auto px-4">
        <time className="text-sm text-stone-600 font-medium block mb-3">
          {formatDate()}
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
        </div>
      </div>
    </header>
  );
}

export default DailyMoodHeader; 