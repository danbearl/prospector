# Multi-User Access Control

## Overview

The Prospector app now implements user-based access control, ensuring that each user can only view and manage their own data. All companies, contacts, outreach history, and relationships are isolated per user.

## Admin User Credentials

An Admin user has been automatically created with all existing data assigned to it:

**Username:** `Admin`  
**Temporary Password:** `Adminbdaiz1gu!`

**⚠️ IMPORTANT:** Change this password immediately after first login!

## How It Works

### Database Schema

All data tables now include a `user_id` column that links records to their owner:

- `companies.user_id` - Links company to user
- `contacts.user_id` - Links contact to user
- `outreach_history.user_id` - Links outreach record to user
- `contact_relationships.user_id` - Links relationship to user

### Data Isolation

1. **Read Operations**: All GET requests automatically filter results by the authenticated user's ID
2. **Create Operations**: All POST requests automatically assign the authenticated user's ID to new records
3. **Update Operations**: Users can only update their own records
4. **Delete Operations**: Users can only delete their own records

### API Behavior

#### Before (No User Isolation)
```javascript
// Get all companies - returns ALL companies in database
GET /api/companies
```

#### After (With User Isolation)
```javascript
// Get all companies - returns only companies owned by authenticated user
GET /api/companies
// Internally: SELECT * FROM companies WHERE user_id = <current_user_id>
```

## Protected Endpoints

All data endpoints now enforce user-based access control:

### Companies
- `GET /api/companies` - Returns only user's companies
- `GET /api/companies/:id` - Returns company only if owned by user
- `POST /api/companies` - Creates company with user's ID
- `PUT /api/companies/:id` - Updates only if owned by user
- `DELETE /api/companies/:id` - Deletes only if owned by user

### Contacts
- `GET /api/contacts` - Returns only user's contacts
- `GET /api/contacts/:id` - Returns contact only if owned by user
- `GET /api/companies/:id/contacts` - Returns contacts for user's company
- `POST /api/contacts` - Creates contact with user's ID
- `PUT /api/contacts/:id` - Updates only if owned by user
- `DELETE /api/contacts/:id` - Deletes only if owned by user

### Contact Relationships
- `GET /api/contacts/:id/relationships` - Returns relationships for user's contact
- `POST /api/contacts/:id/relationships` - Creates relationship with user's ID
- `DELETE /api/relationships/:id` - Deletes only if owned by user

### Outreach History
- `GET /api/outreach` - Returns only user's outreach records
- `GET /api/contacts/:id/outreach` - Returns outreach for user's contact
- `POST /api/contacts/:id/outreach` - Creates outreach with user's ID
- `PUT /api/outreach/:id` - Updates only if owned by user
- `DELETE /api/outreach/:id` - Deletes only if owned by user

## Security Features

1. **Automatic User ID Injection**: The `verifyToken` middleware extracts the user ID from the JWT token and adds it to `req.userId`
2. **Query Filtering**: All database queries include `WHERE user_id = ?` clauses
3. **Ownership Verification**: Update and delete operations verify ownership before proceeding
4. **404 Responses**: Attempting to access another user's data returns "not found" instead of "forbidden" (prevents information leakage)

## Migration of Existing Data

When the application starts for the first time with multi-user access control:

1. **User ID columns are added** to all data tables (if they don't exist)
2. **Admin user is created** with a randomly generated password
3. **All existing records** are automatically assigned to the Admin user
4. **Migration is logged** in the console output

This ensures that existing data remains accessible and is not lost during the upgrade.

## Testing User Isolation

### Test 1: Create Two Users
1. Register a new user (e.g., "TestUser1")
2. Log in as TestUser1
3. Create some companies and contacts
4. Log out

### Test 2: Verify Data Isolation
1. Register another user (e.g., "TestUser2")
2. Log in as TestUser2
3. Verify that you see NO companies or contacts (empty lists)
4. Create some companies and contacts for TestUser2

### Test 3: Verify Admin Data
1. Log in as Admin (using the credentials above)
2. Verify that you see all the original data
3. Verify that TestUser1 and TestUser2's data is NOT visible

### Test 4: Cross-User Access Prevention
1. Log in as TestUser1
2. Note the ID of one of your companies (e.g., ID 5)
3. Log out and log in as TestUser2
4. Try to access `/api/companies/5` directly
5. Verify you get a 404 error (not found)

## User Management

### Creating New Users
Users can self-register through the `/register` page. Each new user starts with an empty database (no companies, contacts, etc.).

### Changing Password
Currently, users can only change their password by:
1. Logging out
2. Registering a new account with a different username

**Note:** Password change functionality should be added in a future update.

### Deleting Users
User deletion is not currently implemented. To remove a user:
1. Access the database directly
2. Delete the user record from the `users` table
3. All associated data will be automatically deleted due to CASCADE constraints

## Database Constraints

Foreign key constraints ensure data integrity:

```sql
-- Companies belong to users
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- Contacts belong to users
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- Relationships belong to users
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- Outreach belongs to users
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

When a user is deleted, all their data is automatically removed.

## Implementation Details

### Backend Changes

**database.js:**
- Added `user_id INTEGER NOT NULL` to all data tables
- Added foreign key constraints with CASCADE delete
- Added migration logic to add columns to existing tables
- Added Admin user creation and data assignment logic

**server.js:**
- Updated all GET queries to filter by `user_id`
- Updated all POST queries to include `user_id`
- Updated all PUT queries to filter by `user_id`
- Updated all DELETE queries to filter by `user_id`
- Added ownership verification for update/delete operations

**auth.js:**
- JWT tokens include `userId` in the payload
- `verifyToken` middleware extracts `userId` and adds to `req.userId`

### Frontend Changes

No frontend changes were required! The frontend continues to work exactly as before because:
- The API automatically filters data by user
- The frontend doesn't need to know about user IDs
- All data operations "just work" with the current user's data

## Troubleshooting

### "Company not found" error when trying to edit
- The company belongs to a different user
- You don't have permission to edit it
- Solution: Only edit companies you created

### Empty lists after login
- This is normal for new users
- New users start with no data
- Solution: Create new companies and contacts

### Can't see data after migration
- Ensure you're logged in as the Admin user
- Check the Admin credentials in the logs
- Solution: Log in with the correct Admin credentials

### Admin password not working
- The password is randomly generated each time the database is initialized
- If you lost the password, you need to reset the database
- Solution: Check `docker compose logs backend` for the password

## Future Enhancements

Potential improvements for multi-user access control:

1. **User Roles**: Add admin, manager, and user roles with different permissions
2. **Data Sharing**: Allow users to share companies/contacts with other users
3. **Team Workspaces**: Create shared workspaces for teams
4. **Audit Logging**: Track who created, modified, or deleted records
5. **Password Reset**: Implement forgot password functionality
6. **User Profile**: Allow users to update their email and password
7. **User Management UI**: Admin interface to manage users
8. **Data Export**: Allow users to export their data
9. **Data Import**: Allow users to import data from CSV
10. **Activity Feed**: Show recent activity across the user's data

## Security Considerations

1. **JWT Token Security**: Tokens contain user ID and are signed with a secret key
2. **SQL Injection Prevention**: All queries use parameterized statements
3. **Authorization Checks**: Every endpoint verifies user ownership
4. **Information Leakage Prevention**: 404 errors instead of 403 to prevent user enumeration
5. **Cascade Deletes**: Ensure data integrity when users are deleted

## Support

For issues related to multi-user access control:
1. Check the backend logs: `docker compose logs backend`
2. Verify you're logged in with the correct user
3. Ensure the database migration completed successfully
4. Check that user_id columns exist in all tables