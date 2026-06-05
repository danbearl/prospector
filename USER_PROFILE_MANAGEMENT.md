# User Profile Management

## Overview

The Prospector app now includes a comprehensive user profile management system that allows users to:
- View their profile information
- Edit their username and email
- Change their password
- Delete their account

All profile changes require the user's current password for security.

## Accessing User Profile

Click on your username (with the 👤 icon) in the top-right corner of the navigation bar to access your profile page.

## Features

### 1. View Profile Information

The profile page displays:
- **Username**: Your current username
- **Email**: Your email address (if set)
- **Member Since**: The date you created your account

### 2. Edit Profile

To update your profile information:

1. Click the **"Edit Profile"** button
2. Modify your username and/or email
3. Enter your **current password** (required for security)
4. Click **"Save Changes"**

**Notes:**
- Username must be unique (you'll get an error if it's already taken)
- Email is optional
- Current password is required to confirm changes
- Changes take effect immediately

### 3. Change Password

To change your password:

1. Click the **"Change Password"** button
2. Enter your **current password**
3. Enter your **new password** (minimum 6 characters)
4. Confirm your **new password**
5. Click **"Change Password"**

**Security Requirements:**
- Current password must be correct
- New password must be at least 6 characters
- New password and confirmation must match
- You'll remain logged in after changing password

### 4. Delete Account

⚠️ **WARNING: This action is permanent and cannot be undone!**

To delete your account:

1. Scroll to the **"Danger Zone"** section (red border)
2. Click the **"Delete Account"** button
3. Type **DELETE** in the confirmation field (must be uppercase)
4. Enter your **current password**
5. Click **"Permanently Delete Account"**

**What happens when you delete your account:**
- Your user account is permanently deleted
- All your companies are permanently deleted
- All your contacts are permanently deleted
- All your outreach history is permanently deleted
- All your contact relationships are permanently deleted
- You are immediately logged out
- This action **CANNOT** be undone

## Backend API Endpoints

### Get User Profile
```
GET /api/auth/profile
Authorization: Bearer <token>

Response:
{
  "id": 1,
  "username": "john",
  "email": "john@example.com",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Update User Profile
```
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "currentPassword": "current_password",
  "username": "new_username",
  "email": "new_email@example.com"
}

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "username": "new_username",
    "email": "new_email@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Change Password
```
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "currentPassword": "current_password",
  "newPassword": "new_password"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Delete Account
```
DELETE /api/auth/account
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "currentPassword": "current_password"
}

Response:
{
  "success": true,
  "message": "Account deleted successfully"
}
```

## Security Features

### Password Verification
All profile management operations require the user's current password:
- **Edit Profile**: Prevents unauthorized changes if someone gains access to an unlocked device
- **Change Password**: Ensures only the account owner can change the password
- **Delete Account**: Prevents accidental or unauthorized account deletion

### Password Requirements
- Minimum 6 characters
- Stored as bcrypt hash (10 salt rounds)
- Never transmitted or stored in plain text

### Data Integrity
- Username uniqueness is enforced at the database level
- Foreign key constraints ensure data consistency
- CASCADE delete removes all user data when account is deleted

### Token Management
- JWT tokens remain valid after profile updates
- Tokens are invalidated after account deletion
- User is automatically logged out after account deletion

## Error Handling

### Common Errors

**"Current password is incorrect"**
- You entered the wrong current password
- Solution: Double-check your password and try again

**"Username already exists"**
- Another user has already taken that username
- Solution: Choose a different username

**"New password must be at least 6 characters"**
- Your new password is too short
- Solution: Use a password with at least 6 characters

**"New passwords do not match"**
- The new password and confirmation don't match
- Solution: Ensure both fields have the same password

**"Please type DELETE to confirm"**
- You didn't type "DELETE" exactly (must be uppercase)
- Solution: Type DELETE in all caps

## User Interface

### Profile Information Section
- White background with subtle shadow
- Displays current user information
- "Edit Profile" button to enter edit mode

### Edit Mode
- Form with username and email fields
- Password field for current password
- "Save Changes" (green) and "Cancel" (gray) buttons
- Returns to view mode after saving or canceling

### Change Password Section
- Separate section below profile information
- Collapsible - click "Change Password" to expand
- Three password fields: current, new, confirm
- "Change Password" (green) and "Cancel" (gray) buttons

### Danger Zone Section
- Red border to indicate danger
- Warning message about permanent deletion
- Collapsible - click "Delete Account" to expand
- Requires typing "DELETE" and current password
- "Permanently Delete Account" (red) and "Cancel" (gray) buttons

## Best Practices

### For Users

1. **Use a Strong Password**: Choose a password that's hard to guess
2. **Keep Email Updated**: Helps with account recovery (future feature)
3. **Verify Before Deleting**: Double-check before deleting your account
4. **Change Password Regularly**: Update your password periodically for security
5. **Log Out on Shared Devices**: Always log out when using shared computers

### For Administrators

1. **Backup Data**: Regularly backup the database before user deletions
2. **Monitor Deletions**: Keep logs of account deletions for audit purposes
3. **Educate Users**: Inform users about the permanence of account deletion
4. **Test Recovery**: Ensure data is properly deleted when accounts are removed

## Future Enhancements

Potential improvements for user profile management:

1. **Email Verification**: Verify email addresses during registration and updates
2. **Password Reset**: Implement forgot password functionality via email
3. **Two-Factor Authentication**: Add 2FA for enhanced security
4. **Profile Picture**: Allow users to upload profile pictures
5. **Account Recovery**: Soft delete with recovery period before permanent deletion
6. **Activity Log**: Show user's recent activity and login history
7. **Export Data**: Allow users to export their data before deletion
8. **Password Strength Meter**: Visual indicator of password strength
9. **Session Management**: View and revoke active sessions
10. **Notification Preferences**: Manage email and in-app notifications

## Troubleshooting

### Can't update profile
- Ensure you're entering the correct current password
- Check that the new username isn't already taken
- Verify you're logged in with a valid token

### Password change not working
- Verify current password is correct
- Ensure new password meets minimum requirements (6 characters)
- Check that new password and confirmation match

### Account deletion failed
- Ensure you typed "DELETE" in all caps
- Verify current password is correct
- Check that you're logged in with a valid token

### Profile changes not reflected
- Refresh the page to see updated information
- Check browser console for any errors
- Verify the backend is running: `docker compose logs backend`

## Testing

### Test Profile Update
1. Log in to your account
2. Navigate to profile page (click username in nav bar)
3. Click "Edit Profile"
4. Change username or email
5. Enter current password
6. Click "Save Changes"
7. Verify changes are reflected immediately

### Test Password Change
1. Navigate to profile page
2. Click "Change Password"
3. Enter current password
4. Enter new password (at least 6 characters)
5. Confirm new password
6. Click "Change Password"
7. Log out and log back in with new password

### Test Account Deletion
1. Create a test account
2. Add some test data (companies, contacts)
3. Navigate to profile page
4. Scroll to "Danger Zone"
5. Click "Delete Account"
6. Type "DELETE"
7. Enter current password
8. Click "Permanently Delete Account"
9. Verify you're logged out
10. Try to log in with deleted account (should fail)
11. Verify all data was deleted from database

## Support

For issues with user profile management:
1. Check this documentation for solutions
2. Review backend logs: `docker compose logs backend`
3. Check browser console for frontend errors
4. Ensure you're using the correct password
5. Verify the database is accessible and not corrupted