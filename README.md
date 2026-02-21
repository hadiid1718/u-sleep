# Job Finder AI

A full-stack web application that helps users find and manage job opportunities with AI-powered features. The platform includes user authentication, job filtering, demo scheduling, and an admin dashboard.

## Features

### User Features
- User registration and authentication
- Job listing and filtering
- Job detail view
- Demo scheduling system
- User dashboard
- Profile management
- Real-time notifications

### Admin Features
- Admin authentication
- Admin dashboard
- User management
- Demo management
- Analytics and metrics
- Compliance tracking
- System health monitoring

### Core Functionality
- JWT-based authentication
- CORS-enabled API
- MongoDB database
- AI-powered proposal generation (OpenAI & Google Gemini)
- Upwork job integration with caching
- Responsive design with Tailwind CSS
- Error handling and validation

## Tech Stack

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Server**: Nodemon (for development)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **UI Icons**: Lucide React
- **Styling**: Tailwind CSS
- **HTTP Client**: Fetch API

## Project Structure

```
job_finder_ai/
├── backend/
│   ├── app.js                    # Express app setup
│   ├── package.json
│   ├── config/
|   |   └── arcjet.js               # Environment variables
│   │   └── env.js                  
│   ├── controller/
│   │   ├── auth.controller.js    # Auth logic (User & Admin)
│   │   ├── user.controller.js    # User management
│   │   └── demo.controller.js    # Demo scheduling
│   ├── database/
│   │   └── mongodb.js            # MongoDB connection
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT verification
│   │   └── error.middleware.js   # Error handling
|   |   └── arcjet.middleware.js  # Security handling
│   ├── models/
│   │   ├── user.model.js         # User schema
│   │   ├── admin.model.js        # Admin schema
│   │   └── demo.model.js         # Demo schema
│   ├── routes/
│   │   ├── auth.router.js        # Auth routes
│   │   ├── user.router.js        # User routes
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
    ├── src/
    │   ├── main.jsx              # App entry point
    │   ├── App.jsx               # Main App component
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── SignIn.jsx
    │   │   ├── SignUp.jsx
    │   │   ├── AdminSignIn.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   └── JobResultPage.jsx
    │   ├── components/
    │   │   ├── home/
    │   │   ├── admin/
    │   │   ├── jobs/
    │   │   ├── user/
    │   │   ├── shared/
    │   │   └── models/
    │   ├── context/
    │   │   └── Context.jsx       # Global state management
    │   └── utils/
    │       ├── api.js            # API utilities & fetch calls
    │       └── toast.js          # Toast notifications
    └── public/
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud instance)

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.development.local` file:
```env
PORT=5000
NODE_ENV=development
DB_URI=mongodb://localhost:27017/job_finder_ai
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to Frontend folder:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file (optional):
```env
VITE_API_URL=http://localhost:5000/api/v1
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication Routes (`/api/v1/auth`)

#### User Authentication
- `POST /sign-up` - Register new user
  - Body: `{ name, email, password }`
  
- `POST /sign-in` - Sign in user
  - Body: `{ email, password }`
  
- `POST /sign-out` - Sign out user

#### Admin Authentication
- `POST /admin/login` - Admin login
  - Body: `{ username, password }`
  
- `GET /admin/profile` - Get admin profile (requires auth)

### Demo Routes (`/api/v1/demo`)

- `GET /available-dates` - Get available demo dates
  
- `GET /available-times/:date` - Get available time slots for a date
  
- `POST /schedule` - Schedule a demo
  - Body: `{ email, name, company, phone, demoDate, timeSlot }`
  
- `GET /all` - Get all demos (admin)
  
- `GET /:id` - Get demo by ID (admin)
  
- `PUT /:id/status` - Update demo status (admin)
  - Body: `{ status, notes }`
  
- `DELETE /:id` - Cancel demo (admin)

### User Routes (`/api/v1/users`)

- Available user management endpoints

## Default Admin Credentials

The system creates a default admin on startup using environment variables:
- **Username**: `ADMIN_USERNAME` (from .env)
- **Password**: `ADMIN_PASSWORD` (from .env)

Default values: admin / admin123

## Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. **Token Storage**: Tokens are stored in localStorage as `token`
2. **Token Format**: `Bearer {token}` in Authorization header
3. **Token Payload**: 
   - For users: `{ userId, ... }`
   - For admins: `{ adminId, role, ... }`

## API Utilities (Frontend)

The frontend includes a comprehensive API utility file (`src/utils/api.js`) with:

### Auth API
```javascript
authAPI.signUp(name, email, password)
authAPI.signIn(email, password)
authAPI.signOut()
authAPI.adminLogin(username, password)
authAPI.getAdminProfile()
```

### Demo API
```javascript
demoAPI.getAvailableDates()
demoAPI.getAvailableTimes(date)
demoAPI.scheduleDemo(demoData)
demoAPI.getAllDemos()
demoAPI.getDemoById(demoId)
demoAPI.updateDemoStatus(demoId, status, notes)
demoAPI.cancelDemo(demoId)
```

### Error Handling
```javascript
getErrorMessage(error)        // Get user-friendly error message
handleApiError(response)      // Handle API error responses
setToken(token)              // Store token
clearToken()                 // Clear token
getToken()                   // Get stored token
```

## Available Routes

### Public Routes
- `/` - Home page
- `/user/sign-in` - User sign in
- `/user/sign-up` - User sign up
- `/admin/sign-in` - Admin sign in
- `/demo-scheduling` - Demo scheduling page

### Protected Routes
- `/user/dashboard` - User dashboard
- `/admin/dashboard` - Admin dashboard
- `/job-result` - Job results

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```

### Production Build (Frontend)

```bash
cd Frontend
npm run build
npm run preview
```

## Error Handling

The application includes comprehensive error handling:

- **Backend**: Express error middleware with status codes
- **Frontend**: Try-catch blocks with user-friendly error messages
- **Validation**: Input validation on both client and server

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev server)

Modify `backend/app.js` to add more origins for production.

## Environment Variables

### Backend (.env.development.local)
```
PORT                  - Server port (default: 5000)
NODE_ENV             - Environment (development/production)
DB_URI               - MongoDB connection string
JWT_SECRET           - Secret key for JWT signing
JWT_EXPIRES_IN       - Token expiration time (e.g., 7d)
ADMIN_USERNAME       - Default admin username
ADMIN_PASSWORD       - Default admin password
```

### Frontend (.env.local)
```
VITE_API_URL         - Backend API URL
```

## Key Features Implementation

### Authentication Flow
1. User/Admin submits credentials
2. Backend validates and generates JWT token
3. Token stored in localStorage
4. Token included in Authorization header for protected routes
5. Middleware verifies token and attaches user/admin to request

### Demo Scheduling
1. Frontend fetches available dates (excludes weekends)
2. User selects date, fetches available time slots
3. User fills form and submits
4. Backend validates and creates demo record
5. Duplicate bookings are prevented

### State Management
Global context (`Context.jsx`) manages:
- User/Admin authentication state
- Form data across steps
- Loading and error states
- Step navigation

## Troubleshooting

### CORS Errors
- Ensure backend is running on correct port
- Check CORS configuration in `backend/app.js`
- Verify frontend is using correct API URL

### Authentication Errors
- Check token is being stored in localStorage
- Verify JWT_SECRET in .env matches
- Ensure middleware is properly checking tokens

### Database Connection
- Verify MongoDB is running
- Check DB_URI is correct
- Ensure network access if using MongoDB Atlas

## Future Enhancements

- Email notifications for demo confirmations
- Advanced job filtering with AI
- User profile insights
- Admin analytics dashboard
- OAuth integration (Google, GitHub)
- Real-time chat support
- Video call integration for demos

## License

This project is private and intended for internal use.

## Support

For issues or questions, please contact the development team.
