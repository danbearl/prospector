# Emergency Admin Promotion

## Overview
The Emergency Admin Promotion feature provides a secure way to promote a user to admin status even when no admin accounts are available in the system. This is a critical recovery mechanism that operates via direct API calls without requiring admin authentication.

## When to Use
Use emergency promotion in these scenarios:
- All admin accounts have been locked out or deleted
- Admin passwords have been lost and cannot be recovered
- System needs immediate admin access for critical operations
- Initial admin account was accidentally demoted

## Prerequisites
1. **Super Admin Key**: You must have access to the `SUPER_ADMIN_KEY` environment variable
2. **API Access**: Ability to make HTTP POST requests to the server
3. **Username**: Know the username of the account to promote

## Setup

### 1. Generate a Super Admin Key
Generate a strong random key using OpenSSL:
```bash
openssl rand -base64 32
```

Example output: `xK7mP9vQ2wR5tY8uI3oL6nM4jH1gF0dS9aZ7cX5bV2eN8mK4pQ3wR6tY9uI0oL1n`

### 2. Set Environment Variable
Add the key to your environment configuration:

**For Docker (docker-compose.yml):**
```yaml
services:
  backend:
    environment:
      - SUPER_ADMIN_KEY=your-generated-key-here
```

**For Local Development (.env file):**
```
SUPER_ADMIN_KEY=your-generated-key-here
```

**For Production:**
Set the environment variable through your hosting platform's configuration panel or deployment scripts.

### 3. Restart the Server
After setting the environment variable, restart the backend server to load the new configuration.

## Usage

### Using cURL
```bash
curl -X POST http://localhost:3001/api/admin/emergency-promote \
  -H "Content-Type: application/json" \
  -D '{
    "username": "john_doe",
    "superAdminKey": "your-super-admin-key-here"
  }'
```

### Using PowerShell (Windows)
```powershell
$body = @{
    username = "john_doe"
    superAdminKey = "your-super-admin-key-here"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/admin/emergency-promote" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### Using Python
```python
import requests

url = "http://localhost:3001/api/admin/emergency-promote"
data = {
    "username": "john_doe",
    "superAdminKey": "your-super-admin-key-here"
}

response = requests.post(url, json=data)
print(response.json())
```

### Using Postman
1. Create a new POST request
2. URL: `http://localhost:3001/api/admin/emergency-promote`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "username": "john_doe",
  "superAdminKey": "your-super-admin-key-here"
}
```
5. Send the request

## Response Examples

### Success Response
```json
{
  "success": true,
  "message": "User john_doe has been promoted to admin via emergency procedure"
}
```

### Error Responses

**Invalid Super Admin Key:**
```json
{
  "error": "Invalid super admin key"
}
```

**User Not Found:**
```json
{
  "error": "User not found"
}
```

**User Already Admin:**
```json
{
  "error": "User is already an admin"
}
```

**Missing Parameters:**
```json
{
  "error": "Username and super admin key are required"
}
```

**Super Admin Key Not Configured:**
```json
{
  "error": "Super admin key not configured on server"
}
```

## Security Features

### 1. Logging
All emergency promotion attempts are logged to the server console:

**Successful Promotion:**
```
🚨 EMERGENCY PROMOTION: User john_doe (ID: 5) promoted to admin using super admin key
```

**Failed Attempts:**
```
⚠️  FAILED EMERGENCY PROMOTION ATTEMPT for username: john_doe - Invalid super admin key
⚠️  FAILED EMERGENCY PROMOTION ATTEMPT - User not found: john_doe
```

### 2. No Authentication Required
- The endpoint does NOT require a valid JWT token
- This allows promotion even when no admin accounts exist
- The super admin key serves as the authentication mechanism

### 3. Key Protection
- Store the key securely in environment variables
- Never commit the key to version control
- Rotate the key periodically
- Limit access to the key to trusted administrators only

### 4. Audit Trail
- All attempts (successful and failed) are logged
- Logs include username and timestamp
- Failed attempts help detect unauthorized access attempts

## Best Practices

### 1. Key Management
- **Generate Strong Keys**: Use cryptographically secure random generation
- **Secure Storage**: Store in environment variables, not in code
- **Access Control**: Limit who has access to the key
- **Regular Rotation**: Change the key periodically (e.g., every 90 days)
- **Documentation**: Keep secure records of key changes

### 2. Usage Guidelines
- **Last Resort**: Use only when normal admin promotion is not possible
- **Verify User**: Confirm the username before promoting
- **Document Usage**: Record when and why emergency promotion was used
- **Review Logs**: Check server logs after emergency promotion
- **Change Key**: Consider rotating the key after emergency use

### 3. Recovery Procedures
1. Identify the user account to promote
2. Verify you have the correct super admin key
3. Make the API call using one of the methods above
4. Verify the promotion was successful
5. Login with the newly promoted admin account
6. Review system state and make necessary adjustments
7. Consider promoting additional trusted users as backup admins
8. Document the incident for future reference

## Troubleshooting

### Key Not Working
- Verify the key is set in the environment variables
- Check for extra spaces or quotes in the key
- Ensure the server was restarted after setting the key
- Confirm you're using the correct key (check secure documentation)

### User Not Found
- Verify the username is correct (case-sensitive)
- Check that the user account exists in the database
- Ensure you're using the username, not the email

### Server Not Responding
- Verify the server is running
- Check the correct port (default: 3001)
- Ensure firewall rules allow the connection
- Check server logs for errors

### Still Can't Access
If emergency promotion fails:
1. Check server logs for detailed error messages
2. Verify database connectivity
3. Consider direct database access as last resort
4. Contact system administrator or hosting support

## Alternative Recovery Methods

If emergency promotion is not available:

### 1. Direct Database Access
```sql
-- Connect to the database
sqlite3 /path/to/prospector.db

-- Promote user to admin
UPDATE users SET is_admin = 1 WHERE username = 'john_doe';

-- Verify the change
SELECT id, username, is_admin FROM users WHERE username = 'john_doe';
```

### 2. Database Script
Create a script file `promote-user.js`:
```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./backend/data/prospector.db');

const username = process.argv[2];
if (!username) {
  console.error('Usage: node promote-user.js <username>');
  process.exit(1);
}

db.run('UPDATE users SET is_admin = 1 WHERE username = ?', [username], function(err) {
  if (err) {
    console.error('Error:', err.message);
  } else if (this.changes === 0) {
    console.error('User not found:', username);
  } else {
    console.log(`Successfully promoted ${username} to admin`);
  }
  db.close();
});
```

Run with: `node promote-user.js john_doe`

## Security Considerations

### Risks
- **Key Exposure**: If the super admin key is compromised, unauthorized users can promote themselves
- **No Rate Limiting**: The endpoint does not have rate limiting (consider adding in production)
- **Logging Only**: Failed attempts are logged but not blocked

### Mitigations
- Store key securely in environment variables
- Rotate key regularly
- Monitor server logs for suspicious activity
- Limit network access to the API endpoint
- Consider adding IP whitelisting for this endpoint
- Implement alerting for emergency promotion usage

## Made with Bob