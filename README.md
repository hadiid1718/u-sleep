# Job Finder AI

A full-stack web application that helps users find and manage job opportunities with AI-powered features. The platform includes user authentication, job matching, AI-powered proposal generation, demo scheduling, and a comprehensive admin dashboard.

## Features

### User Features
- User registration and authentication (JWT)
- Job listing, filtering, and matching based on preferences
- AI-powered proposal/response generation
- Demo scheduling system with date & time slot selection
- User dashboard with stats (jobs viewed, matched, proposals sent)
- Profile management with job preferences (keywords, rate type, role)
- Real-time notifications

### Admin Features
- Admin authentication with role-based access
- Admin dashboard with metrics
- **User management** — view, search, delete, and flag/unflag accounts
- **Demo management** — view, filter, paginate, update status, cancel
- Analytics, compliance tracking, and system health monitoring

### Core Functionality
- JWT-based authentication with Bearer token
- Rate limiting & security via Arcjet
- MongoDB database with Mongoose ODM
- AI-powered proposal generation (OpenAI & Google Gemini)
- Upwork job integration with configurable caching
- Server-side pagination & filtering
- Responsive design with Tailwind CSS v4
- Centralized API service layer (frontend)
- Comprehensive error handling and validation

## Tech Stack

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Security**: Arcjet (rate limiting, bot protection)
- **AI Services**: OpenAI API, Google Gemini API
- **Dev Tools**: Nodemon, ESLint

### Frontend
- **Framework**: React 19 with Vite
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React, React Icons
- **Notifications**: React Toastify
- **HTTP**: Fetch API with centralized service layer

## Project Structure

```
job_finder_ai/
├── README.md
├── backend/
│   ├── app.js                    # Express app setup & middleware
│   ├── package.json
│   ├── config/
│   │   ├── arcjet.js             # Arcjet security config
│   │   └── env.js                # Environment variable exports
│   ├── controller/
│   │   ├── auth.controller.js    # Auth logic (User & Admin)
│   │   ├── user.controller.js    # User CRUD + flag/unflag
│   │   ├── demo.controller.js    # Demo scheduling (paginated)
│   │   ├── job.controller.js     # Job listing & matching
│   │   └── proposal.controller.js # Proposal management
│   ├── database/
│   │   └── mongodb.js            # MongoDB connection
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── error.middleware.js   # Global error handler
│   │   └── arcject.middleware.js # Arcjet security middleware
│   ├── models/
│   │   ├── user.model.js         # User schema (prefs, stats, flagging)
│   │   ├── admin.model.js        # Admin schema
│   │   ├── demo.model.js         # Demo schema
│   │   ├── job.model.js          # Job schema
│   │   └── proposal.model.js     # Proposal schema
│   ├── routes/
│   │   ├── auth.router.js        # Auth routes
│   │   ├── user.router.js        # User routes (CRUD + flag)
│   │   ├── job.router.js         # Job routes
│   │   ├── proposal.router.js    # Proposal routes
│   │   └── demo.router.js        # Demo routes
│   └── services/
│       ├── ai.service.js         # AI proposal generation (OpenAI & Gemini)
│       └── upwork.service.js     # Upwork API integration & job caching
└── Frontend/
    ├── vite.config.js
    ├── package.json
    ├── index.html
    ├── Dockerfile                # Docker setup
    ├── compose.yaml
    ├── src/
    │   ├── main.jsx              # App entry point
    │   ├── App.jsx               # Main App with routing
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── SignIn.jsx
    │   │   ├── SignUp.jsx
    │   │   ├── AdminSignIn.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── JobResultPage.jsx
    │   │   └── CountDown.jsx
    │   ├── components/
    │   │   ├── home/             # Landing page sections
    │   │   ├── admin/
    │   │   │   ├── Management/   # Admin management panels
    │   │   │   │   ├── UserManagementSection.jsx
    │   │   │   │   ├── DemoManagementSection.jsx
    │   │   │   │   ├── AnalyticsSection.jsx
    │   │   │   │   ├── ComplianceSection.jsx
    │   │   │   │   ├── RevenueSection.jsx
    │   │   │   │   ├── SettingsSection.jsx
    │   │   │   │   ├── SystemHealthSection.jsx
    │   │   │   │   └── MessageManagementSection.jsx
    │   │   │   └── utils/        # Reusable admin components
    │   │   │       ├── DataTable.jsx
    │   │   │       ├── DemoCard.jsx
    │   │   │       ├── DemoFilter.jsx
    │   │   │       ├── DemoStatusform.jsx
    │   │   │       ├── EmptyState.jsx
    │   │   │       ├── LoadingState.jsx
    │   │   │       ├── MatricCard.jsx
    │   │   │       ├── Model.jsx
    │   │   │       └── UserForm.jsx
    │   │   ├── jobs/             # Job listing & response components
    │   │   ├── user/             # User dashboard, settings, prompts
    │   │   ├── shared/           # Navbar, Footer, LoadingScreen
    │   │   └── models/           # Modal components
    │   ├── context/
    │   │   └── Context.jsx       # Global state management
    │   └── utils/
    │       ├── api.js            # Centralized API service (auth, demo, user)
    │       └── toast.js          # Toast notification helpers
    └── public/
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm
- MongoDB (local or MongoDB Atlas)

### Backend Setup

```bash
cd backend
npm install
```

Create `.env.development.local`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DB_URI=mongodb://localhost:27017/job_finder_ai
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Security
ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development

# Upwork API
UPWORK_API_KEY=
UPWORK_API_SECRET=
UPWORK_CLIENT_ID=
UPWORK_CLIENT_SECRET=
UPWORK_ACCESS_TOKEN=
UPWORK_REFRESH_TOKEN=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4
OPENAI_ORG_ID=

# Google Gemini
GOOGLE_GEMINI_API_KEY=
GOOGLE_GEMINI_MODEL=gemini-pro

# Feature Flags
USE_BACKGROUND_JOBS=false
JOB_CACHE_TTL=3600
JOB_CACHE_ENABLED=true
PROPOSAL_GENERATION_TIMEOUT=30000
```

Start the server:
```bash
npm start        # uses --watch flag
# or
npm run dev      # uses nodemon
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd Frontend
npm install
```

Create `.env.local` (optional):
```env
VITE_API_URL=http://localhost:5000/api/v1
```

Start the dev server:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/sign-up` | Register new user | No |
| POST | `/sign-in` | Sign in user | No |
| POST | `/sign-out` | Sign out user | No |
| POST | `/admin/login` | Admin login | No |
| GET | `/admin/profile` | Get admin profile | Yes |

### Demo Scheduling (`/api/v1/demo`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/available-dates` | Get next 30 weekdays | No |
| GET | `/available-times/:date` | Get time slots for a date | No |
| POST | `/schedule` | Schedule a demo | No |
| GET | `/all?page=1&limit=9&status=&date=&email=` | Get all demos (paginated) | Admin |
| GET | `/:id` | Get demo by ID | Admin |
| PUT | `/:id/status` | Update demo status | Admin |
| DELETE | `/:id` | Cancel demo | Admin |

### User Management (`/api/v1/users`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all users | No |
| GET | `/:id` | Get user by ID | Yes |
| PUT | `/:id` | Update user | Yes |
| PUT | `/:id/flag` | Flag/unflag user account | Yes |
| DELETE | `/:id` | Delete user | Yes |

**Flag/Unflag request body:**
```json
{ "isFlagged": true, "flagReason": "Terms & conditions violation" }
```

### Job Routes (`/api/v1/jobs`)
- Job listing, matching, and detail endpoints

### Proposal Routes (`/api/v1/proposals`)
- AI-powered proposal generation and management

## Default Admin Credentials

Created on startup from environment variables:
- **Username**: value of `ADMIN_USERNAME` (default: `admin`)
- **Password**: value of `ADMIN_PASSWORD` (default: `admin123`)

## Authentication Flow

1. User/Admin submits credentials
2. Backend validates and generates JWT token
3. Token stored in `localStorage` as `token`
4. Token sent as `Bearer {token}` in `Authorization` header
5. `auth.middleware.js` verifies token and attaches user to `req`

**Token payload:**
- Users: `{ userId, ... }`
- Admins: `{ adminId, role, ... }`

## Frontend API Services (`src/utils/api.js`)

All API calls go through a centralized `apiRequest` wrapper that handles auth headers, error responses, and token management.

```javascript
// Auth
authAPI.signUp(name, email, password)
authAPI.signIn(email, password)
authAPI.signOut()
authAPI.adminLogin(username, password)
authAPI.getAdminProfile()

// Demos
demoAPI.getAvailableDates()
demoAPI.getAvailableTimes(date)
demoAPI.scheduleDemo(demoData)
demoAPI.getAllDemos({ page, limit, status, date, email })
demoAPI.getDemoById(demoId)
demoAPI.updateDemoStatus(demoId, status, notes)
demoAPI.cancelDemo(demoId)

// Users (Admin)
userAPI.getAllUsers()
userAPI.getUserById(userId)
userAPI.updateUser(userId, userData)
userAPI.deleteUser(userId)
userAPI.flagUser(userId, flagReason)
userAPI.unflagUser(userId)

// Utilities
getErrorMessage(error)
handleApiError(response)
setToken(token) / clearToken() / getToken()
```

## Frontend Routes

### Public
| Path | Page |
|------|------|
| `/` | Home page |
| `/user/sign-in` | User sign in |
| `/user/sign-up` | User sign up |
| `/admin/sign-in` | Admin sign in |
| `/demo-scheduling` | Demo scheduling |

### Protected
| Path | Page |
|------|------|
| `/user/dashboard` | User dashboard |
| `/admin/dashboard` | Admin dashboard |
| `/job-result` | Job results |

## Running the Application

### Development

```bash
# Terminal 1 — Backend
cd backend
npm start

# Terminal 2 — Frontend
cd Frontend
npm run dev
```

### Production Build

```bash
cd Frontend
npm run build
npm run preview
```

### Docker

```bash
cd Frontend
docker compose up --build
```

## Key Features

### Demo Management (Admin)
- Server-side pagination with `page` and `limit` query params
- Filterable by status, date, and email
- Status updates: scheduled, completed, cancelled, no-show
- Metric cards showing totals

### User Management (Admin)
- DataTable with all users (name, email, role, status, proposals, join date)
- Search by name or email with clear button
- Client-side pagination (10 per page)
- **Delete** users with confirmation
- **Flag/Unflag** accounts for terms violations with reason input
- Metrics: Total Users, Active, Flagged, Proposals Sent

### AI Proposal Generation
- Supports OpenAI (GPT-4) and Google Gemini
- Configurable timeout via `PROPOSAL_GENERATION_TIMEOUT`
- Integrated with Upwork job data

### Job Caching
- Upwork job results cached with configurable TTL (`JOB_CACHE_TTL`)
- Toggle via `JOB_CACHE_ENABLED` feature flag

## Error Handling

- **Backend**: Global error middleware with status codes and structured responses
- **Frontend**: `apiRequest` wrapper returns `{ success, data }` or `{ success, error }` — no unhandled rejections
- **Validation**: Input validation on both client and server sides

## CORS Configuration

Configured in `backend/app.js` to accept requests from:
- `http://localhost:5173` (Vite dev server)
- Value of `FRONTEND_URL` env variable

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Ensure backend is running; check `FRONTEND_URL` in env |
| Auth failures | Verify `JWT_SECRET` matches; check token in localStorage |
| DB connection | Verify MongoDB is running; check `DB_URI`; allow network access for Atlas |
| Demo slots not loading | Check date format (YYYY-MM-DD); ensure backend is reachable |
| Users not showing | Verify `/api/v1/users` endpoint returns data; check browser console |

## Future Enhancements

- Email notifications for demo confirmations
- Advanced AI job filtering and scoring
- User profile insights and analytics
- OAuth integration (Google, GitHub)
- Real-time chat support
- Video call integration for demos
- Webhook notifications for flagged accounts

## License

This project is private and intended for internal use.

## Support

For issues or questions, please contact the development team.
