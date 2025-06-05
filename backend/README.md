# UCLA Reddit Summarizer Backend

An AI-powered system that scrapes r/ucla, clusters trending posts, and generates funny news articles.

## Architecture

- **Reddit Scraping**: Python + PRAW for incremental data fetching
- **AI Processing**: Gemini 2.0 Flash for clustering and article generation
- **Storage**: MongoDB for articles and metadata
- **API**: Express.js REST API
- **Authentication**: JWT-based user authentication

## Quick Setup

### 1. Environment Setup

```bash
cp template.env .env
```

Required credentials in `.env`:
- `REDDIT_CLIENT_ID` - From Reddit app registration
- `REDDIT_CLIENT_SECRET` - From Reddit app registration  
- `GEMINI_API_KEY` - From Google AI Studio
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT authentication (see JWT Setup below)

### 2. Install Dependencies

```bash
npm install

cd python
pip install -r requirements.txt
cd ..
```

### 3. Start MongoDB

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the Server

```bash
npm start
```

## JWT Authentication Setup

### 1. Generate JWT Secret

Generate a secure random string for JWT signing:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Configure JWT

1. Copy the generated string
2. Add it to your `.env` file:
   ```
   JWT_SECRET=your_generated_secret_here
   ```

### 3. Authentication Features

- **User Registration**: POST `/api/auth/register`
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name"
  }
  ```

- **User Login**: POST `/api/auth/login`
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **Protected Routes**: Include JWT token in Authorization header
  ```
  Authorization: Bearer <your-jwt-token>
  ```

### 4. Security Notes

- Never commit your JWT_SECRET to version control
- Use different secrets for development and production
- Rotate secrets periodically in production
- Minimum password length: 8 characters
- Passwords are hashed using bcrypt before storage

## Pipeline Process

1. **Fetch Posts**: Python script gets new r/ucla posts since last timestamp
2. **Filter**: Remove deleted posts, spam, heavily downvoted content
3. **Cluster**: Gemini AI identifies semantic trends (min 3 posts per cluster)
4. **Generate**: AI creates funny articles for each significant trend
5. **Store**: Save articles to MongoDB and update timestamp

## Reddit App Setup

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Choose "script" type
4. Use `http://localhost:3001` as redirect URI
5. Copy client ID (under app name) and secret
