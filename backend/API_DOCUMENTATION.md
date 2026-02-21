# Job Finder AI - Backend API Documentation

## Overview
Complete backend implementation for job searching, filtering, and intelligent proposal generation using Upwork API and AI services (OpenAI/Google Gemini).

---

## ✅ Completed Implementation

### 1. **Data Models**

#### User Model (Updated)
- `jobPreferences`: Stores user settings
  - `keywords[]`: Search keywords
  - `rateType`: 'hourly' or 'fixed'
  - `hourlyRate` / `fixedRate`: User's rates
  - `userRole`: 'freelancer' or 'agency'
  - `badJobCriteria[]`: Filtering criteria
  - `upworkProfileUrl`: User's profile link
- `stats`: Track user activities

#### Job Model (New)
- Job data from Upwork API
- AI analysis with match score (0-100)
- Green flags & red flags identification
- Caching with TTL for performance
- User relationship tracking

#### Proposal Model (New)
- Complete status lifecycle: draft → sent → received → viewed → accepted/rejected
- Support for multiple AI services (OpenAI/Gemini)
- Status history timeline tracking
- Case study integration for proposal upgrades
- User feedback and rating system

---

### 2. **Services**

#### Upwork Service (`services/upwork.service.js`)
**Non-blocking job fetching with intelligent filtering:**

```javascript
// Search jobs with keywords
await upworkService.searchJobs(keywords, filters)

// Apply bad job filters
upworkService.applyBadJobFilters(jobs, badCriteria)

// Match user rate expectations
upworkService.applyRateMatching(jobs, userRate, rateType)

// Automatic job caching (24-hour TTL)
```

**Features:**
- Automatic caching reduces duplicate API calls
- Fallback to cache if API is down
- Supports hourly & fixed rate filtering
- Client quality filtering (payment verification, rating, etc.)
- Skill-based matching

#### AI Proposal Service (`services/ai.service.js`)
**Supports both OpenAI and Google Gemini:**

```javascript
// Generate proposal
await aiService.generateProposal({
  aiService: 'openai' | 'gemini',
  job: jobDetails,
  user: userProfile,
  caseStudy: optional
})

// Upgrade proposal with case study
await aiService.upgradeProposalWithCaseStudy(proposal, job, user, caseStudy)
```

**Features:**
- 30-second timeout (configurable)
- Personalized prompts based on job & user profile
- Case study integration for authority-building
- Non-blocking generation (background processing)
- Fallback error handling

---

### 3. **Controllers**

#### Job Controller (`controller/job.controller.js`)

**Endpoints:**
- `POST /api/v1/jobs/search-with-ai` - Search with intelligent scoring
- `GET /api/v1/jobs/filtered` - Get cached/filtered jobs
- `GET /api/v1/jobs/:jobId` - Get job details
- `PUT /api/v1/jobs/:jobId/match` - Mark as matched
- `PUT /api/v1/jobs/:jobId/reject` - Mark as rejected with feedback

**Key Features:**
- Intelligent match scoring algorithm:
  - Budget alignment (max 30 pts)
  - Client quality (max 20 pts)
  - Job clarity (max 15 pts)
  - Low competition (max 15 pts)
  - Base score: 50 pts (total 0-100)
- Green/red flag extraction
- Real-time user stats updates
- Non-blocking job fetching

#### Proposal Controller (`controller/proposal.controller.js`)

**Endpoints:**
- `POST /api/v1/proposals/job/:jobId/generate` - Generate proposal (async)
- `GET /api/v1/proposals` - Get user proposals
- `GET /api/v1/proposals/:proposalId` - Get proposal details
- `POST /api/v1/proposals/:proposalId/send` - Send to Upwork
- `PATCH /api/v1/proposals/:proposalId/status` - Update status
- `POST /api/v1/proposals/:proposalId/upgrade` - Upgrade with case study
- `POST /api/v1/proposals/:proposalId/copy` - Copy to clipboard
- `POST /api/v1/proposals/:proposalId/rate` - Rate proposal quality
- `DELETE /api/v1/proposals/:proposalId` - Delete proposal
- `GET /api/v1/proposals/stats/summary` - Get proposal statistics

**Status Workflow:**
```
draft → sent → received → viewed → accepted/rejected
                                  ↓
                            withdrawn
```

---

## 🚀 API Routes

### Jobs API
```
POST   /api/v1/jobs/search-with-ai
GET    /api/v1/jobs/filtered?page=1&limit=20&status=pending
GET    /api/v1/jobs/:jobId
PUT    /api/v1/jobs/:jobId/match
PUT    /api/v1/jobs/:jobId/reject
```

### Proposals API
```
POST   /api/v1/proposals/job/:jobId/generate
GET    /api/v1/proposals?page=1&limit=10&status=sent
GET    /api/v1/proposals/:proposalId
POST   /api/v1/proposals/:proposalId/send
PATCH  /api/v1/proposals/:proposalId/status
POST   /api/v1/proposals/:proposalId/upgrade
POST   /api/v1/proposals/:proposalId/copy
POST   /api/v1/proposals/:proposalId/rate
DELETE /api/v1/proposals/:proposalId
GET    /api/v1/proposals/stats/summary
```

---

## 📋 Request/Response Examples

### 1. Search Jobs with AI Analysis

**Request:**
```javascript
POST /api/v1/jobs/search-with-ai
{
  "keywords": ["React", "Node.js"],
  "filters": {
    "limit": 50,
    "offset": 0
  }
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "jobs": [
      {
        "uploadJobId": "12345",
        "title": "Senior React Developer",
        "description": "Build scalable SaaS...",
        "budgetType": "fixed",
        "budget": { "amount": 3000, "currency": "USD" },
        "aiAnalysis": {
          "matchScore": 92,
          "recommendation": "Highly Recommended",
          "greenFlags": ["Payment Verified", "Top Rated: 4.9", "Low Competition"],
          "redFlags": [],
          "reasoning": "This job matches your profile..."
        }
      }
    ],
    "totalFound": 15,
    "message": "Total Jobs Found: 15"
  }
}
```

### 2. Generate Proposal

**Request:**
```javascript
POST /api/v1/proposals/job/620e7a1c8a5d4a001b5c9e2f/generate
{
  "aiService": "openai"  // or "gemini"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Proposal generation started...",
  "data": {
    "proposalId": "630f8b2d9b6e5b112c6d0f3g",
    "status": "generating",
    "jobId": "620e7a1c8a5d4a001b5c9e2f"
  }
}
```

**After generation completes**, fetch proposal:
```javascript
GET /api/v1/proposals/630f8b2d9b6e5b112c6d0f3g
```

### 3. Send Proposal

**Request:**
```javascript
POST /api/v1/proposals/630f8b2d9b6e5b112c6d0f3g/send
{
  "bidAmount": 2500,
  "estimatedDuration": "3 months",
  "deliveryDate": "2026-04-21"
}
```

### 4. Upgrade Proposal with Case Study

**Request:**
```javascript
POST /api/v1/proposals/630f8b2d9b6e5b112c6d0f3g/upgrade
{
  "caseStudy": "Successfully delivered React SaaS platform for TechCorp saving them $50K annually..."
}
```

---

## 🔧 Environment Variables

```env
# Upwork API (Demo/Sandbox)
UPWORK_API_KEY=upwork_demo_key_...
UPWORK_CLIENT_ID=upwork_client_id_...
UPWORK_ACCESS_TOKEN=upwork_access_token_...

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4-turbo

# Google Gemini
GOOGLE_GEMINI_API_KEY=AIzaSyD...
GOOGLE_GEMINI_MODEL=gemini-2.0-flash

# Feature Flags
JOB_CACHE_ENABLED=true
JOB_CACHE_TTL=3600
PROPOSAL_GENERATION_TIMEOUT=30000
```

---

## ⚡ Performance Optimization

### 1. Non-blocking Job Fetching
- Search returns immediately while fetching happens in background
- User doesn't wait for API responses
- Jobs cached for 1 hour (configurable)

### 2. Intelligent Caching
- Automatic job caching with 24-hour TTL
- Falls back to cache if API is down
- `bulkWrite` operations for efficient batch inserts

### 3. AI Generation Performance
- 30-second timeout prevents hanging
- Async proposal generation in background
- No UI blocking while generating

### 4. Database Optimization
- Compound indexes on frequently queried fields
- Job deduplication using unique `upworkJobId`
- Proper pagination support

---

## 🔐 Security & Validation

✅ **Authentication**: All routes protected with JWT middleware
✅ **Authorization**: Users can only access their own jobs/proposals
✅ **Input Validation**: Proper error handling with status codes
✅ **Rate Limiting**: Arcjet middleware active on all routes
✅ **Data Sanitization**: Trim, lowercase email, validation rules

---

## 📊 Workflow Summary

### Step 1: User Input Setup
User stores preferences in their profile:
- Keywords, rates, bad job criteria, profile URL
- Account type (freelancer/agency)

### Step 2: Search Jobs
```
POST /jobs/search-with-ai → AI scores jobs → Returns sorted list with scores 60-100
```

### Step 3: Select Job
User clicks "Match Job" → Job marked as matched

### Step 4: Generate Proposal
```
POST /proposals/job/:jobId/generate → Async generation → Poll for completion → Display proposal
```

### Step 5: Manage Proposal
- Send to Upwork
- Track status (sent → received → viewed → accepted/rejected)
- Upgrade with case study
- Rate quality
- Copy to clipboard

---

## 🎯 Next Steps (Frontend Integration)

1. Update user profile page to save job preferences
2. Create job search UI that calls `/jobs/search-with-ai`
3. Add proposal generation trigger button
4. Implement status polling for async operations
5. Add case study modal for proposal upgrades
6. Track statistics dashboard with proposal stats endpoint

---

## 📝 Notes

- All responses follow standard format: `{ success, message, data }`
- Errors include statusCode for proper HTTP status
- Jobs auto-expire from cache after TTL
- Proposal status is immutable once accepted/rejected
- Stats update in real-time on key actions
