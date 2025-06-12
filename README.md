# BruinDigest

r/ucla Reddit News Summarizer - A Progressive Web Application

## Team Members
- George Zhou
- Jacob Goodman
- Andrew Hong  

## Overview
BruinDigest fetches and summarizes posts from r/ucla using AI, providing UCLA students with a concise news feed of campus discussions and updates.

## Project Structure
```
frontend/          # React application
backend/           # Express.js API server  
```

## Tech Stack
- Frontend: React, Tailwind CSS
- Backend: Express.js, Node.js
- Database: MongoDB with Mongoose 
- Caching: Redis 
- AI: Gemini + PRAW
- Deployment: Github Actions + GKE

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional for caching)

### Frontend
```bash
cd frontend
npm install
npm start
```
App runs on `http://localhost:3000`

### Backend
1. Configure environment
```bash
cd backend
cp template.env .env
# Edit .env with your API keys and database URLs
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
# or
npm start
```
API runs on `http://localhost:3001`

## Deployment

### GKE Deployment
1. Configure GitHub Actions secrets:
   - `GCP_PROJECT_ID` - Your Google Cloud project ID
   - `GCP_SA_KEY` - Service account JSON key with GKE permissions
   - `GEMINI_API_KEY` - Gemini AI API key
   - `REDDIT_CLIENT_ID` - Reddit API client ID
   - `REDDIT_CLIENT_SECRET` - Reddit API client secret
   - `JWT_SECRET` - Secret for JWT token signing
   - `MONGODB_URI` - MongoDB connection string

2. Push to `main` branch to trigger automatic deployment

3. Get deployment URL from GitHub Actions logs or:
```bash
kubectl get ingress -n bruindigest
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - User logout (requires auth)
- `POST /api/auth/me/profile-picture` - Update profile picture (requires auth)

### Articles
- `GET /api/articles` - Get recent articles
- `GET /api/articles/today` - Get today's articles with daily summary
- `GET /api/articles/past` - Get past articles
- `GET /api/articles/:id` - Get specific article
- `GET /api/articles/daily-summary/:date?` - Get daily summary for date

### Comments
- `GET /api/articles/:id/comments` - Get article comments
- `POST /api/articles/:id/comments` - Create comment (requires auth)

### System
- `POST /api/articles/generate` - Trigger article generation pipeline
- `GET /api/health` - Health check
