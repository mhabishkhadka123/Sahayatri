# Sahayatra - Marriage Partner Finder Platform

A production-quality, full-stack marriage partner finder platform built with modern web technologies.

## Tech Stack

### Frontend
- **React 19.2.7** with Vite 8.1.1 for fast development and optimized production builds
- **React Router 7.0.0** for client-side routing with protected routes
- **Tailwind CSS 3.4.3** for utility-first styling with custom design tokens
- **Zustand 4.5.2** for lightweight global state management
- **Axios 1.7.7** with automatic JWT token handling and request/response interceptors
- **React Hook Form** for efficient form handling
- **Framer Motion** for smooth animations and transitions
- **Socket.io Client 4.7.2** for real-time messaging

### Backend
- **Node.js** with ES modules
- **Express 4.18.2** for HTTP server and REST API
- **Socket.io 4.7.2** for real-time communication
- **Prisma 5.0.0** as ORM with PostgreSQL database
- **JWT (jsonwebtoken 9.0.2)** for authentication
- **bcrypt** for password hashing
- **Multer** for file uploads
- **Cloudinary** for image hosting (integration ready)

## Project Structure

```
sahayatra/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Common/          (Modal, Loading, Card, etc.)
│   │   │   ├── Layout/          (Header, Footer, MainLayout)
│   │   │   ├── Input/           (Reusable input components)
│   │   │   ├── Button/          (Reusable button components)
│   │   │   └── ProtectedRoute/  (Auth guard component)
│   │   ├── pages/               (8 main pages)
│   │   ├── services/            (API service layer with Axios)
│   │   ├── hooks/               (useAuth, useRequireAuth, usePrevious)
│   │   ├── context/             (Zustand stores for global state)
│   │   ├── App.jsx              (Router configuration)
│   │   └── main.jsx             (Entry point)
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env                     (Environment variables)
│
└── backend/
    ├── src/
    │   ├── controllers/         (Business logic for all features)
    │   │   ├── authController.js
    │   │   ├── profileController.js
    │   │   ├── discoveryController.js
    │   │   ├── matchController.js
    │   │   ├── chatController.js
    │   │   └── notificationController.js
    │   ├── routes/              (API endpoints)
    │   │   ├── auth.js
    │   │   ├── profiles.js
    │   │   ├── discovery.js
    │   │   ├── matches.js
    │   │   ├── chat.js
    │   │   └── notifications.js
    │   ├── middleware/
    │   │   └── auth.js          (JWT authentication middleware)
    │   ├── utils/
    │   │   └── jwt.js           (Token generation and verification)
    │   └── index.js             (Express server & Socket.io setup)
    ├── prisma/
    │   └── schema.prisma        (Database models)
    ├── package.json
    ├── .env                     (Environment variables)
    └── .env.example
```

## Key Features

### Authentication & User Management
- ✅ User signup with email validation
- ✅ Secure login with JWT tokens
- ✅ Refresh token flow (7-day auth token, 30-day refresh token)
- ✅ Protected routes with automatic redirection
- ✅ Password change functionality

### Profile Management
- ✅ Complete profile creation and editing
- ✅ Multiple photo uploads with Cloudinary integration
- ✅ Photo management (upload, delete, set primary)
- ✅ Profile visibility and status tracking

### Discovery & Matching
- ✅ Browse profiles with filtering (age, gender)
- ✅ Search profiles by name/city
- ✅ Like/skip profiles
- ✅ Automatic mutual match detection
- ✅ Match history and details

### Real-time Messaging
- ✅ Conversation management
- ✅ Real-time message delivery via Socket.io
- ✅ Message read status tracking
- ✅ Message deletion
- ✅ Conversation history with pagination

### Notifications
- ✅ Like notifications
- ✅ Match notifications
- ✅ Message notifications
- ✅ Mark as read (individual and bulk)
- ✅ Delete notifications

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/change-password` - Change password (protected)

### Profiles
- `GET /api/profiles/:userId` - Get user profile
- `PUT /api/profiles/me` - Update user profile (protected)
- `POST /api/profiles/upload-photo` - Upload profile photo (protected)
- `GET /api/profiles/photos` - Get all photos (protected)
- `DELETE /api/profiles/photo/:photoId` - Delete photo (protected)

### Discovery
- `GET /api/discovery/profiles` - Browse profiles with filters (protected)
- `GET /api/discovery/search` - Search profiles (protected)
- `GET /api/discovery/profiles/:userId` - Get profile details (protected)

### Matches
- `POST /api/matches/like/:userId` - Like a profile (protected)
- `POST /api/matches/skip/:userId` - Skip a profile (protected)
- `GET /api/matches/mutual` - Get all matches (protected)
- `GET /api/matches/:matchId` - Get match details (protected)
- `DELETE /api/matches/:userId` - Unmatch (protected)

### Chat
- `GET /api/chat/conversations` - Get user conversations (protected)
- `GET /api/chat/conversations/:conversationId/messages` - Get messages (protected)
- `POST /api/chat/conversations/:conversationId/messages` - Send message (protected)
- `PUT /api/chat/conversations/:conversationId/read` - Mark as read (protected)
- `DELETE /api/chat/messages/:messageId` - Delete message (protected)

### Notifications
- `GET /api/notifications` - Get notifications (protected)
- `PUT /api/notifications/:id/read` - Mark as read (protected)
- `PUT /api/notifications/read-all` - Mark all as read (protected)
- `DELETE /api/notifications/:id` - Delete notification (protected)

## Setup Instructions

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_SOCKET_URL=http://localhost:5000
```

4. Start development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sahayatra"
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
REFRESH_TOKEN_EXPIRE=30d
PORT=5000
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
```

4. Set up PostgreSQL database:
   - Ensure PostgreSQL is running
   - Create database: `sahayatra`

5. Run Prisma migrations:
```bash
npm run prisma:migrate
```

6. Start development server:
```bash
npm run dev
```

## Database Schema

### Core Models

**User**
- email (unique)
- password (hashed)
- firstName, lastName
- gender
- dateOfBirth
- bio, city, height
- religion, occupation, phone
- isVerified, verificationToken
- refreshToken
- timestamps

**Profile** (1:1 with User)
- profileViewCount
- lastActive

**Photo** (1:many with User)
- url
- cloudinaryId
- isPrimary

**Like** (many:many relationship)
- likedById, likedByOtherId (unique constraint)

**Match** (many:many relationship)
- userOneId, userTwoId (unique constraint)
- status (matched)

**Conversation** (many:many through ConversationParticipant)
- timestamps

**ConversationParticipant**
- userId, conversationId (unique constraint)

**Message**
- content
- senderId
- conversationId
- readAt
- timestamps

**Notification**
- userId
- type (like, match, message)
- fromUserId
- read
- timestamps

## Authentication Flow

1. **Signup**: User provides email, password, and basic info
   - Password is hashed with bcrypt
   - User and Profile records created
   - Auth token and refresh token generated

2. **Login**: User provides email and password
   - Email and password validated
   - Tokens generated and stored in localStorage
   - Refresh token saved in database

3. **Protected Routes**: 
   - Frontend checks `isAuthenticated` from auth store
   - Backend middleware validates JWT token from Authorization header
   - Automatic token refresh on 401 response

4. **Token Refresh**:
   - Frontend catches 401 error
   - Sends refreshToken to `/api/auth/refresh-token`
   - Receives new authToken
   - Retries original request

## State Management (Zustand Stores)

1. **useAuthStore**: User authentication state
2. **useUIStore**: UI state (modals, toasts, sidebar)
3. **useDiscoveryStore**: Profile browsing state
4. **useChatStore**: Messaging state
5. **useNotificationStore**: Notifications state

## Real-time Features

### Socket.io Events
- `join_conversation`: User joins a conversation room
- `send_message`: Send message to conversation
- `receive_message`: Broadcast incoming messages
- `leave_conversation`: User leaves a conversation room

## Frontend Pages

1. **Home** (`/`) - Landing page with hero, features, stats, CTA
2. **Login** (`/login`) - User login form
3. **Signup** (`/signup`) - User registration form
4. **Dashboard** (`/dashboard`) - Overview with stats and quick actions
5. **Discover** (`/discover`) - Browse profiles with swipe-like interface
6. **Matches** (`/matches`) - View mutual matches in grid layout
7. **Messages** (`/messages`) - Messaging interface with real-time updates
8. **Profile** (`/profile`) - User profile editor with photo management

## Build & Deployment

### Frontend
```bash
npm run build  # Creates optimized dist/ folder
```

Build output:
- 463 modules transformed
- CSS: 21.73 KB (gzipped: 5.40 KB)
- JS: 461.44 KB (gzipped: 147.92 KB)
- Build time: ~1.15s

### Backend
Run with Node.js directly (ES modules):
```bash
npm run dev      # Development with hot reload
npm start        # Production
npm run prisma:migrate  # Run database migrations
```

## Development Notes

- All pages are fully connected to backend APIs
- Reusable component pattern established
- Clean folder structure maintained
- JWT interceptors handle token refresh automatically
- Socket.io ready for real-time messaging
- Cloudinary integration prepared (file upload logic ready)

## Future Enhancements

- [ ] Email verification
- [ ] Password reset flow
- [ ] Advanced search filters (height, religion, etc.)
- [ ] User blocking/reporting
- [ ] Profile verification with documents
- [ ] Video calling integration
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Admin panel

## Support

For issues or questions, refer to the API documentation or check the backend console for error details.
