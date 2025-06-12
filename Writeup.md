# BruinDigest Writeup

## Architecture
### User Interaction
Users access BruinDigest through a PWA built with React. This app is able to run on most browsers and devices, and is able to be downloaded and used offline with a service worker. 

### Frontend Delivery
The React app is served by an Nginx container in the Frontend Service, hosted on GKE. All traffic is routed through a Google Cloud HTTPS Load Balancer and Kubernetes Ingress controller.

### API Communication
When the frontend needs data (when logging in/fetching new posts), it sends an HTTPS request to the Backend Service, a Node.js/Express server in GKE, where the authorization (JWT tokens), content retrieval/generation (through the Reddit API and Gemini API), and validation and security checks are done (through the security middleware). 

### Data Storage
The backend communicates with a MongoDB database that contains the original Reddit articles, comments, user info, and the generated articles. 

### Content Generation
Reddit posts are fetched using the Reddit API and then are sent to Google Gemini API for summarization, which is then stored in MongoDB. This is then loaded to the frontend for the user to be able to view. 

### Offline PWA
The service worker checks for cached articles and keeps them loaded if the user is offline. 

## Security
We used MongoSanitize in order to mitigate database injections, blocking bad inputs from entering the database. 

We also used the xss library to remove scripts from user input to prevent XSS attacks. 

We implemented JWT tokens passed via Authorization headers with Bearer authentication. The tokens have a 7-day expiration to limit abuse if compromised (since they will no longer be valid after 7 days), and all API requests require valid JWT tokens for protected endpoints.

We implemented CSRF protection using the csrf library, allowing us to prevent cross-site attacks by requiring a CSRF token tied to the user's session for any requests.

We also implemented rate-limiting on things like making accounts and logging in to prevent brute-force attacks or DOS attacks.

Helmet prevents clickjacking and things like reflected XSS by setting most CSP settings to be very restrictive (except for inline scripts for Tailwind and React) and to disable frameAncestors (basically disabling framing). 

I also utilized HTTP parameter pollution protection to make sure if someone makes a request, it has defined limits as to what can be input.

We enforced HTTPS due to the requirement, but this allows all traffic to be encrypted, removing the potential of man-in-the-middle attacks

We utilized secure cookies to prevent cookies from being able to be easily extracted from the site. 

## Requirements Checklist

### 1. Semantic HTML5 Elements and APIs

#### Semantic HTML5 Elements
Some examples of semantic HTML5 elements used are:
- **`<aside>`**: Sidebar containers
  ```javascript
  // frontend/src/App.js:427
  <aside className="sidebar-container p-6">
  
  // frontend/src/App.js:472
  <aside className="fixed left-0 top-0 w-1/5 h-screen bg-orange-50/40 border-r border-orange-100 z-10">
  ```

- **`<main>`**: Main content areas
  ```javascript
  // frontend/src/App.js:480
  <main className="flex-1 ml-[20%] mr-[20%]">
  ```

- **`<header>`**: Page headers
  ```javascript
  // frontend/src/App.js:492
  <header className="fixed top-0 left-[20%] right-[20%] bg-orange-50/60 backdrop-blur-sm border-b border-orange-100 z-20">
  ```

- **`<nav>`**: Navigation elements
  ```javascript
  // frontend/src/App.js:502
  <nav className="flex items-center justify-between">
  ```


#### Camera and Microphone API (1d)
We used the camera to be able to set a profile picture and used the microphone to be able to leave audio recordings as comments
```javascript
// frontend/src/components/CameraCapture.js:26-94
let mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

// frontend/src/components/VoiceRecorder.js:66-167
const microphone = audioContext.createMediaStreamSource(stream);
```

### 2. Responsive Design
We used responsive design to automatically resize the page as it shrinks. 
```javascript
// frontend/src/App.js:463-570
// desktop
<div className="hidden xl:flex">

// tablet
<div className="hidden lg:flex xl:hidden flex-col h-screen">

// mobile
<div className="md:hidden flex flex-col h-screen">
```

### 3. PWA Offline Support
We created the ability to download and use the app offline with cached contents. 
```json
// frontend/public/manifest.json:20
"display": "standalone",
```

```javascript
// frontend/public/sw.js:1-289
// Service Worker implementation with caching strategies

// frontend/src/App.js:14-24
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
```

### 4. HTTPS
We enabled HTTPS. 
```yaml
# k8s/ingress.yaml:8
kubernetes.io/ingress.allow-http: "false"
```

### 5. Single Page Application
Only the main component scrolls, not the entire page.
```javascript
// frontend/src/App.js:2
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// frontend/src/App.js:442-548
<Routes>
  <Route path="/" element={<Feed />} />
</Routes>
```

### 6. Beauty
Functional and clean design implemented

### 7. CSS Processor (Tailwind)
We used Tailwind throughout the project to do animations and other prettifications. 
```javascript
// frontend/tailwind.config.js:1-9
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
```

```json
// frontend/package.json
"postcss": "^8.4.21",
"tailwindcss": "^3.2.4"
```

### 8. Authentication with Cookies/JWT
We implemented JWT for user authentication as seen below. : 
#### JWT Implementation
```javascript
// backend/src/models/User.js:65-76
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};
```

#### Cookie Banner (8a)
The cookie banner pops up the first time you open the page to let the user know cookies are being used. The code is below. 
```javascript
// frontend/src/components/CookieBanner.js:26-33
<div className="fixed bottom-0 left-0 right-0 bg-stone-800 text-stone-100 p-4 border-t border-stone-700 z-50">
    <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
    <div className="flex-1">
        <p className="text-sm">
        We use cookies to enhance your experience and analyze campus trends. 
        By continuing to use this site, you consent to our use of cookies.
        </p>
    </div>
```

### 9. Security Vulnerabilities Protection
We used the following libraries to implement security features like CSRF, XSS, database injection, paramater pollution protection, and rate-limiting. 
```javascript
// backend/src/middleware/security.js:1-199
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const csrf = require('csrf');
const xss = require('xss');
const helmet = require('helmet');

```

### 10. Database with ORM and Caching
We used MongoDB to store the Reddit posts and the generated feed articles. 
#### MongoDB with Mongoose ORM
```javascript
// backend/src/models/User.js:1-84
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({...
```

The caching layer caches frequent API responses. Articles are cached for a few minutes. This allows improved performance instead of having to constantly load info again and again.  
#### Redis Caching
```javascript
// backend/src/services/cache.js:1-96
const redis = require('redis');
class CacheService {...
```

### 11. Node.js and Express
We utilized Node.js and Express for our backend
```javascript
// backend/src/app.js:1-5
const express = require('express');
```

README.md in backend describes how to start the Node.js server

### 12. PWA with Service Worker
We enabled the ability to download the app. 
```javascript
// frontend/public/sw.js:1-289
```

### 13. WebAssembly Module
Not used

### 14. API Integration (AI Services)
We fed the Reddit articles into Gemini to get a comprehensive, cohesive summary. 
```javascript
// backend/src/services/gemini.js:1-413
class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
```

### 15. Frontend Framework (React)
We used React for our frontend. 
```json
// frontend/package.json:6
"react": "^18.2.0",
```

```javascript
// frontend/src/App.js:1
import React, { useState, useEffect, useRef } from 'react';
```

### 16. Accessibility

#### ARIA Features

**Role Attributes:**
```javascript
// frontend/src/App.js:176
<nav className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50" role="menu">

// frontend/src/App.js:188
role="menuitem"

// frontend/src/components/Header.js:18
<nav className="h-full flex items-center justify-center" role="navigation">

// frontend/src/components/Feed.js:100
<section className="mb-6 bg-orange-100/70 border border-orange-200 rounded-lg p-4" role="alert">

// frontend/src/components/DailyMoodHeader.js:78
<span className="text-3xl" role="img" aria-label="Campus mood">
```

**ARIA Labels:**
```javascript
// frontend/src/components/CommentSection.js:197
aria-label="Comments section"

// frontend/src/components/PostCard.js:91
aria-label={showComments ? "Hide comments" : "Show comments"}

// frontend/src/components/CameraCapture.js:251
aria-label="Switch camera"

// frontend/src/components/Feed.js:142
<section className="space-y-6 mb-8" aria-label="Today's campus trend articles">
```

**Live Regions:**
```javascript
// frontend/src/components/Feed.js:80
<section className="text-center" aria-live="polite">
```

**Alt Text for Images:**
```javascript
// frontend/src/App.js:165
alt={user.name}

// frontend/src/components/CommentSection.js:359
alt={comment.author.name}
```

### 17. Google Cloud Deployment with CI/CD
```yaml
# .github/workflows/deploy.yml:1-147
name: Build, Test, and Deploy to GKE
on:
  push:
    branches: [ main ]

# .github/workflows/deploy.yml:74-80
- name: Build and push frontend image
  run: |-
    cd frontend
    docker build -t "gcr.io/$PROJECT_ID/bruindigest-frontend:$GITHUB_SHA" .
    docker push "gcr.io/$PROJECT_ID/bruindigest-frontend:$GITHUB_SHA"
```