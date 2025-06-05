#!/usr/bin/env python3

import praw
import json
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def fetch_posts_since_timestamp(timestamp=None, limit=100):
    """
    Fetch posts from r/ucla since the given timestamp
    Returns list of post data in JSON format
    """
    
    reddit = praw.Reddit(
        client_id=os.getenv('REDDIT_CLIENT_ID'),
        client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
        user_agent=os.getenv('REDDIT_USER_AGENT', 'ucla-news-summarizer/1.0')
    )
    
    subreddit = reddit.subreddit('ucla')
    posts_data = []
    
    # Get posts from new, hot, and rising to capture different types of trending content
    post_streams = [
        subreddit.new(limit=limit//3),
        subreddit.hot(limit=limit//3),
        subreddit.rising(limit=limit//3)
    ]
    
    seen_post_ids = set()
    
    for stream in post_streams:
        for post in stream:
            # Skip if we've already processed this post
            if post.id in seen_post_ids:
                continue
                
            # Convert timestamp to datetime for comparison
            post_time = datetime.fromtimestamp(post.created_utc)
            
            # If timestamp provided, only include posts newer than timestamp
            if timestamp:
                cutoff_time = datetime.fromtimestamp(timestamp)
                if post_time <= cutoff_time:
                    continue
            
            seen_post_ids.add(post.id)
            
            # Get top comments (limit to avoid rate limiting)
            post.comments.replace_more(limit=0)
            top_comments = []
            for comment in post.comments[:5]:  # Top 5 comments
                if hasattr(comment, 'body') and len(comment.body) > 0:
                    top_comments.append({
                        'body': comment.body,
                        'score': comment.score,
                        'created_utc': comment.created_utc
                    })
            
            post_data = {
                'id': post.id,
                'title': post.title,
                'selftext': post.selftext,
                'score': post.score,
                'upvote_ratio': post.upvote_ratio,
                'num_comments': post.num_comments,
                'created_utc': post.created_utc,
                'url': post.url,
                'permalink': f"https://reddit.com{post.permalink}",
                'author': str(post.author) if post.author else '[deleted]',
                'flair_text': post.link_flair_text,
                'is_self': post.is_self,
                'top_comments': top_comments
            }
            
            posts_data.append(post_data)
    
    return posts_data

def main():
    if len(sys.argv) > 1:
        try:
            timestamp = float(sys.argv[1])
        except ValueError:
            timestamp = None
    else:
        timestamp = None
    
    try:
        posts = fetch_posts_since_timestamp(timestamp)
        
        result = {
            'success': True,
            'posts': posts,
            'count': len(posts),
            'scraped_at': datetime.now().timestamp()
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'posts': [],
            'count': 0
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main() 