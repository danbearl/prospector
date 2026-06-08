# Admin User Management Feature

## Overview
This document describes the Admin User Management feature that allows administrators to view all users in the Prospector application.

## Features

### 1. Admin Role
- Users can be designated as administrators by setting the `is_admin` field to `1` in the database
- The default "Admin" user is automatically created with admin privileges on first run
- Admin status is included in JWT tokens and user sessions

### 2. Admin-Only View
- **Route**: `/admin/users`
- **Access**: Only visible to users with admin privileges
- **Navigation**: Admin link (👑 Admin) appears in the navbar only for admin users

### 3. User List Display
The Admin Users page displays:
- User ID
- Username (with crown icon 👑 for admins)
- Email address
- Role (Admin/User badge)
- User statistics (companies, contacts, outreach, campaigns count)
- Account creation date and time
- Total user count
- Highlighted rows for admin users (yellow background)
- Reassign Data button for users with data

### 4. Admin Promotion/Demotion
Administrators can promote users to admin or demote admins to regular users:

#### Standard Promotion (Admin-to-Admin)
- **Access**: Any existing admin can promote users
- **Process**:
  1. Click "⬆️ Promote to Admin" button next to a regular user
  2. Confirm the promotion in the dialog
  3. User immediately gains admin privileges
- **Safety features**:
  - Confirmation dialog
  - Action is logged in server console
  - Immediate effect

#### Emergency Promotion (API-Only)
- **Access**: Direct API call with super admin key (NO admin authentication required)
- **Use case**: Emergency recovery when all admin accounts are unavailable or inaccessible
- **Method**: API-only (not available in UI for security)
- **Process**:
  1. Make POST request to `/api/admin/emergency-promote`
  2. Provide username and super admin key
  3. User is promoted immediately
  4. Action is prominently logged
- **Safety features**:
  - Requires secret key (SUPER_ADMIN_KEY environment variable)
  - Works even when no admins exist
  - Action is prominently logged in server console
  - Failed attempts are logged
  - See [EMERGENCY_ADMIN_PROMOTION.md](EMERGENCY_ADMIN_PROMOTION.md) for detailed usage

#### Demotion
- **Access**: Any admin can demote other admins
- **Process**:
  1. Click "⬇️ Demote from Admin" button next to an admin user
  2. Confirm the demotion
  3. User loses admin privileges
- **Safety features**:
  - Cannot demote yourself
  - Cannot demote the last admin (must promote another user first)
  - Confirmation dialog
  - Action is logged in server console

### 5. Data Reassignment
Administrators can reassign all data from one user to another:
- **Reassignment includes**: Companies, Contacts, Contact Relationships, Outreach History, and Campaigns
- **Process**:
  1. Click "🔄 Reassign Data" button next to a user with data
  2. Select target user from dropdown
  3. Review statistics showing what will be transferred
  4. Confirm the action (with warning about irreversibility)
  5. All data is transferred atomically
- **Safety features**:
  - Cannot reassign to the same user
  - Confirmation dialog with detailed statistics
  - Warning about irreversible action
  - Success/error feedback
  - Automatic user list refresh after reassignment

### 6. Security
- Backend API endpoint `/api/admin/users` is protected by two middleware functions:
  - `verifyToken`: Ensures user is authenticated
  - `verifyAdmin`: Ensures user has admin privileges
- Non-admin users receive a 403 Forbidden error if they attempt to access admin endpoints
- Frontend gracefully handles access denied errors

## Technical Implementation

### Backend Changes

#### 1. Database Schema (`backend/database.js`)
- Added `is_admin` column to users table (INTEGER, default 0)
- Migration logic to add column to existing databases
- Automatic creation of Admin user with random password on first run

#### 2. Authentication (`backend/auth.js`)
- Updated `register()` to include `isAdmin` in user object and JWT token
- Updated `login()` to include `isAdmin` in user object and JWT token
- Updated `verifyToken()` middleware to extract and set `req.isAdmin`
- Added `verifyAdmin()` middleware to check admin privileges
- Exported `verifyAdmin` for use in routes

#### 3. API Routes (`backend/server.js`)
- Added admin routes section
- New endpoint: `GET /api/admin/users` (requires authentication + admin)
  - Returns list of all users with sanitized data (no passwords)
  - Includes statistics for each user (companies, contacts, outreach, campaigns count)
- New endpoint: `POST /api/admin/promote-user` (requires authentication + admin)
  - Promotes a user to admin status
  - Validates user exists and is not already admin
  - Logs promotion action with usernames
- New endpoint: `POST /api/admin/demote-user` (requires authentication + admin)
  - Demotes an admin to regular user
  - Prevents self-demotion
  - Prevents demoting the last admin
  - Logs demotion action with usernames
- New endpoint: `POST /api/admin/emergency-promote` (NO authentication required, uses super admin key)
  - Emergency promotion using SUPER_ADMIN_KEY environment variable
  - Works even when no admin accounts exist
  - Accepts username (not userId) for easier emergency use
  - Validates super admin key
  - Logs all attempts (successful and failed)
  - Prominently logs successful emergency promotions
  - See [EMERGENCY_ADMIN_PROMOTION.md](EMERGENCY_ADMIN_PROMOTION.md) for API usage
- New endpoint: `POST /api/admin/reassign-user-data` (requires authentication + admin)
  - Reassigns all data from one user to another
  - Validates both users exist
  - Prevents reassigning to the same user
  - Updates all related tables atomically
- Updated `/api/auth/verify` to return `isAdmin` field

### Frontend Changes

#### 1. New Component (`frontend/src/components/AdminUsers.jsx`)
- Displays user list in a table format with statistics
- Shows loading and error states
- Refresh button to reload user list
- Visual indicators for admin users
- Responsive design with proper styling
- **Admin Promotion/Demotion UI**:
  - "⬆️ Promote to Admin" button for regular users
  - "⬇️ Demote from Admin" button for admin users
  - Promotion modal with confirmation
  - Success/error feedback
  - Automatic refresh after successful promotion/demotion
  - Note: Emergency promotion is API-only (not in UI)
- **Data Reassignment Modal**:
  - Shows source user's data statistics
  - Dropdown to select target user
  - Confirmation dialog with detailed information
  - Warning about irreversible action
  - Success/error feedback
  - Automatic refresh after successful reassignment

#### 2. App Router (`frontend/src/App.jsx`)
- Imported `AdminUsers` component
- Added route: `/admin/users`
- Protected route with `ProtectedRoute` wrapper
- Conditional navigation link (only shown to admins)

#### 3. Navigation
- Admin link appears in navbar only when `user.isAdmin === true`
- Crown icon (👑) for visual distinction
- Positioned between Campaigns and user profile

## Usage

### For Administrators

1. **Login as Admin**
   - Use the Admin username and the temporary password shown in console on first run
   - **Important**: Change the password after first login via the Profile page

2. **Access User Management**
   - Click the "👑 Admin" link in the navigation bar
   - View the complete list of all registered users

3. **User Information**
   - See all user accounts in the system
   - Identify admin users by the crown icon and yellow highlight
   - View registration dates and email addresses
   - View user statistics (companies, contacts, outreach, campaigns)

4. **Admin Promotion**
   - Click "⬆️ Promote to Admin" for a regular user
   - Confirm the promotion
   - User immediately gains admin privileges
   - Can now access admin features and promote other users

5. **Admin Demotion**
   - Click "⬇️ Demote from Admin" for an admin user
   - Confirm the demotion
   - User loses admin privileges
   - Note: Cannot demote yourself or the last admin

6. **Emergency Admin Promotion (API-Only)**
   - Use when all admin accounts are unavailable or inaccessible
   - Make direct API call to `/api/admin/emergency-promote`
   - Provide username and SUPER_ADMIN_KEY
   - No admin authentication required
   - See [EMERGENCY_ADMIN_PROMOTION.md](EMERGENCY_ADMIN_PROMOTION.md) for detailed instructions
   - Action is logged prominently in server console

7. **Data Reassignment**
   - Click "🔄 Reassign Data" button for users with data
   - Select target user from dropdown
   - Review statistics showing what will be transferred
   - Confirm the reassignment
   - All data is transferred atomically to the target user

### For Regular Users

- Regular users will not see the Admin link in the navigation
- Attempting to access `/admin/users` directly will show an access denied error
- API calls to admin endpoints will return 403 Forbidden

## Security Considerations

1. **Password Security**: The Admin user is created with a random temporary password that should be changed immediately
2. **Token-Based Auth**: Admin status is verified on every request via JWT token
3. **Middleware Protection**: All admin endpoints are protected by both authentication and authorization middleware
4. **Frontend Guards**: Admin UI elements are conditionally rendered based on user role
5. **Backend Validation**: Server-side validation ensures only admins can access protected resources
6. **Super Admin Key**: Emergency promotion requires SUPER_ADMIN_KEY environment variable
   - Generate a strong key: `openssl rand -base64 32`
   - Store securely in environment variables
   - Never commit to version control
   - Rotate periodically
7. **Promotion Logging**: All admin promotions/demotions are logged with usernames and timestamps
8. **Self-Protection**: Admins cannot demote themselves
9. **Last Admin Protection**: Cannot demote the last admin to prevent lockout
10. **Failed Attempts**: Failed emergency promotion attempts are logged with username

## Future Enhancements

Potential improvements for the admin feature:
- User management actions (edit user details, delete users)
- User activity logs and statistics dashboard
- Bulk user operations (bulk promote, bulk delete)
- User search and filtering
- Export user list to CSV
- Advanced role management (custom roles beyond admin/user)
- Password reset functionality for admins
- Undo reassignment functionality
- Reassignment history/audit log
- Email notifications for promotions/demotions
- Two-factor authentication for admin actions
- Session management (view/revoke active sessions)

## Testing

To test the admin feature:

1. **Start the application**
   ```bash
   docker-compose up
   ```

2. **Check console for Admin credentials**
   - Look for the "ADMIN USER CREATED" message
   - Note the temporary password

3. **Login as Admin**
   - Navigate to the login page
   - Use username: `Admin`
   - Use the temporary password from console

4. **Verify Admin Access**
   - Confirm the "👑 Admin" link appears in navigation
   - Click the Admin link
   - Verify you can see all users with their statistics

5. **Test Data Reassignment**
   - Create some test data (companies, contacts) for a user
   - As Admin, click "🔄 Reassign Data" for that user
   - Select a target user from the dropdown
   - Review the statistics in the modal
   - Confirm the reassignment
   - Verify the data was transferred successfully
   - Check that the source user now has 0 items
   - Check that the target user has the transferred items

6. **Test Admin Promotion**
   - As Admin, click "⬆️ Promote to Admin" for a regular user
   - Confirm the promotion
   - Verify the user now has admin badge and crown icon
   - Logout and login as the newly promoted user
   - Verify they can access the Admin panel

7. **Test Admin Demotion**
   - As Admin, promote another user to admin (so you have 2 admins)
   - Click "⬇️ Demote from Admin" for the other admin
   - Confirm the demotion
   - Verify the user no longer has admin badge
   - Try to demote yourself (should fail with error)
   - Demote all other admins until you're the last one
   - Try to demote yourself (should fail - cannot demote last admin)

8. **Test Emergency Promotion (API)**
   - Set SUPER_ADMIN_KEY in environment variables
   - Restart the server
   - Use cURL, Postman, or another tool to make API call
   - POST to `/api/admin/emergency-promote` with username and key
   - Verify the user is promoted
   - Check server console for emergency promotion log
   - Try with wrong key (should fail and log attempt)
   - See [EMERGENCY_ADMIN_PROMOTION.md](EMERGENCY_ADMIN_PROMOTION.md) for examples

9. **Test Non-Admin Access**
   - Register a new regular user account
   - Login with the new account
   - Verify the Admin link does NOT appear
   - Try accessing `/admin/users` directly (should show access denied)
   - Verify no promote/demote buttons are visible

## Troubleshooting

### Admin link not showing
- Verify you're logged in as the Admin user
- Check browser console for errors
- Ensure the user object has `isAdmin: true`
- Re-login to refresh JWT token with admin status

### Access denied error
- Confirm the user has admin privileges in the database
- Check that the JWT token includes the `isAdmin` claim
- Verify the backend middleware is working correctly
- Re-login to get a new token with updated permissions

### Users not loading
- Check backend server logs for errors
- Verify the database connection is working
- Ensure the `/api/admin/users` endpoint is accessible

### Cannot promote user
- Verify you're logged in as an admin
- Check that the target user exists
- Ensure the user is not already an admin
- Check server logs for detailed error messages

### Cannot demote admin
- Verify you're not trying to demote yourself
- Ensure there's more than one admin (cannot demote last admin)
- Check server logs for detailed error messages

### Emergency promotion fails
- Verify SUPER_ADMIN_KEY is set in environment variables
- Ensure the key matches exactly (case-sensitive)
- Check server logs for failed attempt details
- Restart server after setting environment variable
- Verify you're using username (not userId) in the API call
- See [EMERGENCY_ADMIN_PROMOTION.md](EMERGENCY_ADMIN_PROMOTION.md) for troubleshooting

### Super admin key not working
- Verify the key is set in the correct environment file
- Check that the server has been restarted after setting the key
- Ensure no extra spaces or quotes in the environment variable
- Generate a new key if needed: `openssl rand -base64 32`
- Test the API endpoint directly with cURL or Postman

## Made with Bob