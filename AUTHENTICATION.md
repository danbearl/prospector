# Prospector Authentication System

## Overview

The Prospector app now includes a complete username and password authentication system. All API endpoints are protected and require a valid JWT token to access.

## Features

- **User Registration**: Create new user accounts with username, password, and optional email
- **User Login**: Authenticate with username and password to receive a JWT token
- **Protected Routes**: All application routes require authentication
- **Token-based Authentication**: JWT tokens with 7-day expiration
- **Secure Password Storage**: Passwords are hashed using bcrypt with 10 salt rounds
- **Automatic Token Refresh**: Tokens are automatically included in all API requests
- **Session Persistence**: User sessions persist across browser refreshes

## Architecture

### Backend Components

#### 1. Authentication Module (`backend/auth.js`)
- `register(db, username, password, email)`: Creates new user with hashed password
- `login(db, username, password)`: Validates credentials and returns JWT token
- `verifyToken`: Middleware to protect routes and verify JWT tokens
- Uses bcrypt for password hashing (10 salt rounds)
- Uses jsonwebtoken for JWT generation and verification

#### 2. Database Schema (`backend/database.js`)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### 3. API Endpoints (`backend/server.js`)

**Authentication Endpoints:**
- `POST /api/auth/register` - Register new user
  - Body: `{ username, password, email? }`
  - Returns: `{ success, token, user }`
  
- `POST /api/auth/login` - Login user
  - Body: `{ username, password }`
  - Returns: `{ success, token, user }`
  
- `GET /api/auth/verify` - Verify token (protected)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success, user }`
  
- `POST /api/auth/logout` - Logout (client-side token removal)
  - Returns: `{ success, message }`

**Protected Endpoints:**
All existing API endpoints now require authentication:
- `/api/companies/*`
- `/api/contacts/*`
- `/api/outreach/*`
- `/api/relationships/*`

### Frontend Components

#### 1. Login Component (`frontend/src/components/Login.jsx`)
- Username and password input fields
- Error handling and display
- Redirects to dashboard on successful login
- Link to registration page

#### 2. Register Component (`frontend/src/components/Register.jsx`)
- Username, email (optional), password, and confirm password fields
- Client-side validation (password length, matching passwords)
- Error handling and display
- Redirects to dashboard on successful registration
- Link to login page

#### 3. Protected Route Wrapper (`frontend/src/components/ProtectedRoute.jsx`)
- Checks for valid token in localStorage
- Redirects to login if not authenticated
- Wraps all protected routes

#### 4. API Client (`frontend/src/api.js`)
- Request interceptor: Automatically adds JWT token to all requests
- Response interceptor: Handles 401 errors by clearing token and redirecting to login

#### 5. App Component (`frontend/src/App.jsx`)
- Manages user authentication state
- Displays navigation bar with user info and logout button
- Routes for login, register, and protected pages
- Persists user session across page refreshes

## Security Features

1. **Password Hashing**: Bcrypt with 10 salt rounds
2. **JWT Tokens**: 7-day expiration, signed with secret key
3. **Token Storage**: Stored in localStorage (consider httpOnly cookies for production)
4. **Protected Routes**: All API endpoints require valid JWT token
5. **Automatic Logout**: Invalid/expired tokens trigger automatic logout
6. **CORS Protection**: Configured in backend server

## Environment Variables

The following environment variable can be configured in `docker-compose.yml`:

- `JWT_SECRET`: Secret key for signing JWT tokens (default: 'your-secret-key-change-in-production')
  - **IMPORTANT**: Change this to a long, random string in production

## Usage

### First Time Setup

1. Start the application:
   ```bash
   docker compose up -d
   ```

2. Navigate to `http://localhost` (production) or `http://localhost:3000` (development)

3. You will be redirected to the login page

4. Click "Register here" to create a new account

5. Fill in username, password (minimum 6 characters), and optional email

6. After registration, you'll be automatically logged in and redirected to the dashboard

### Logging In

1. Navigate to `http://localhost/login` (production) or `http://localhost:3000/login` (development)

2. Enter your username and password

3. Click "Login"

4. You'll be redirected to the dashboard

### Logging Out

1. Click the "Logout" button in the navigation bar

2. You'll be redirected to the login page

3. Your token will be removed from localStorage

## Token Management

- **Token Expiration**: 7 days from issuance
- **Token Storage**: localStorage (key: 'token')
- **User Data Storage**: localStorage (key: 'user')
- **Automatic Inclusion**: Token automatically added to all API requests via axios interceptor
- **Automatic Logout**: Expired/invalid tokens trigger automatic logout and redirect to login

## API Request Format

All protected API requests must include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

This is handled automatically by the axios interceptor in `frontend/src/api.js`.

## Error Handling

### Backend Errors

- **400 Bad Request**: Missing required fields
- **401 Unauthorized**: Invalid credentials or expired token
- **409 Conflict**: Username already exists
- **500 Internal Server Error**: Server-side error

### Frontend Error Display

- Login/Register forms display error messages in red alert boxes
- API errors are caught and displayed to the user
- 401 errors trigger automatic logout and redirect to login

## Database Persistence

User data is stored in the SQLite database at `/app/data/prospector.db` inside the Docker container. This is persisted using a Docker volume (`backend-data`), so user accounts survive container restarts.

## Security Recommendations for Production

1. **Change JWT_SECRET**: Use a long, random string (at least 32 characters)
2. **Use HTTPS**: Always use HTTPS in production to protect tokens in transit
3. **Consider httpOnly Cookies**: Store tokens in httpOnly cookies instead of localStorage to prevent XSS attacks
4. **Implement Rate Limiting**: Add rate limiting to prevent brute force attacks
5. **Add Password Requirements**: Enforce stronger password policies (uppercase, lowercase, numbers, special characters)
6. **Implement Password Reset**: Add forgot password functionality
7. **Add Email Verification**: Verify email addresses during registration
8. **Implement Refresh Tokens**: Use short-lived access tokens with refresh tokens
9. **Add Account Lockout**: Lock accounts after multiple failed login attempts
10. **Audit Logging**: Log authentication events for security monitoring

## Troubleshooting

### "Invalid or expired token" error
- Your token has expired (7 days)
- Solution: Log out and log back in

### "Username already exists" error
- The username is already taken
- Solution: Choose a different username

### Redirected to login after page refresh
- Token was cleared or is invalid
- Solution: Log in again

### Cannot access API endpoints
- Token is missing or invalid
- Solution: Ensure you're logged in and token is in localStorage

## Testing the Authentication System

1. **Test Registration**:
   - Navigate to `/register`
   - Create a new account
   - Verify you're redirected to dashboard

2. **Test Login**:
   - Log out
   - Navigate to `/login`
   - Log in with your credentials
   - Verify you're redirected to dashboard

3. **Test Protected Routes**:
   - Try accessing `/companies` without logging in
   - Verify you're redirected to login

4. **Test Token Persistence**:
   - Log in
   - Refresh the page
   - Verify you remain logged in

5. **Test Logout**:
   - Click logout button
   - Verify you're redirected to login
   - Try accessing protected routes
   - Verify you're redirected to login

## Files Modified/Created

### Backend
- `backend/auth.js` (new) - Authentication logic
- `backend/server.js` (modified) - Added auth endpoints and protected routes
- `backend/database.js` (modified) - Added users table
- `backend/package.json` (modified) - Added bcrypt, jsonwebtoken, express-session
- `backend/Dockerfile` (modified) - Added auth.js to build

### Frontend
- `frontend/src/components/Login.jsx` (new) - Login page
- `frontend/src/components/Register.jsx` (new) - Registration page
- `frontend/src/components/ProtectedRoute.jsx` (new) - Route protection wrapper
- `frontend/src/App.jsx` (modified) - Added auth routing and state management
- `frontend/src/api.js` (modified) - Added token interceptors

### Docker
- `docker-compose.yml` (modified) - Added JWT_SECRET environment variable

## Support

For issues or questions about the authentication system, please refer to this documentation or check the application logs:

```bash
docker compose logs backend
docker compose logs frontend