# CSV Export Feature - Troubleshooting Guide

## Error: "Failed to export contacts"

This error can occur for several reasons. Follow these steps to diagnose and fix the issue:

---

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Try to export contacts again
4. Look for error messages

### Common Console Errors:

#### Error: "Network Error" or "Failed to fetch"
**Cause:** Backend server is not running or not accessible

**Solution:**
```bash
# Restart the backend server
cd backend
npm start
```

#### Error: "400 Bad Request - No contact IDs provided"
**Cause:** Frontend is sending empty array

**Solution:** This is a bug. Check that contacts are actually selected before clicking export.

#### Error: "401 Unauthorized"
**Cause:** Not logged in or token expired

**Solution:** Log out and log back in.

#### Error: "404 Not Found - No contacts found"
**Cause:** Selected contacts don't belong to your user

**Solution:** This is a security feature. You can only export your own contacts.

---

## Step 2: Check Network Tab

1. Open Developer Tools (F12)
2. Go to the **Network** tab
3. Try to export contacts again
4. Look for the request to `/api/contacts/export`

### What to Check:

**Request Payload:**
```json
{
  "contact_ids": [1, 2, 3]
}
```
- Should be an array of numbers
- Should not be empty

**Response Status:**
- **200 OK** = Success (but download might have failed)
- **400 Bad Request** = Invalid request (check error message)
- **401 Unauthorized** = Not logged in
- **404 Not Found** = Contacts not found
- **500 Internal Server Error** = Backend error (check server logs)

---

## Step 3: Check Backend Server Logs

Look at your backend terminal/console for error messages:

### Common Backend Errors:

#### "CSV export error: contact_ids.every is not a function"
**Cause:** Frontend is sending contact_ids as a string instead of array

**Fix:** Check the API call in `frontend/src/api.js`:
```javascript
export const exportContacts = (contactIds) => 
  api.post('/contacts/export', { contact_ids: contactIds }, { responseType: 'blob' });
```

#### "CSV export error: Cannot read property 'first_name' of undefined"
**Cause:** Database query returned no results

**Fix:** Verify contacts exist and belong to the logged-in user.

#### Syntax Error in server.js
**Cause:** There was an extra closing brace that I removed

**Fix:** Restart the backend server after the fix.

---

## Step 4: Verify Backend Code

Check that the export endpoint exists in `backend/server.js`:

```javascript
// Should be around line 977
app.post('/api/contacts/export', verifyToken, async (req, res) => {
  // ... export logic
});
```

If this code is missing, the endpoint won't work.

---

## Step 5: Verify Frontend Code

### Check API Function

In `frontend/src/api.js`, verify:
```javascript
export const exportContacts = (contactIds) => 
  api.post('/contacts/export', { contact_ids: contactIds }, { responseType: 'blob' });
```

### Check Import Statement

In `frontend/src/components/Contacts.jsx`, verify:
```javascript
import { getContacts, getCompanies, getTags, createContact, updateContact, deleteContact, exportContacts } from '../api';
```

### Check Handler Function

In `frontend/src/components/Contacts.jsx`, verify the `handleExportSelected` function exists.

---

## Step 6: Test with Browser DevTools

You can manually test the API endpoint:

1. Open Developer Tools Console
2. Get your auth token:
```javascript
localStorage.getItem('token')
```

3. Test the endpoint with fetch:
```javascript
fetch('/api/contacts/export', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({ contact_ids: [1, 2, 3] })
})
.then(response => response.text())
.then(csv => console.log(csv))
.catch(error => console.error('Error:', error));
```

Replace `[1, 2, 3]` with actual contact IDs from your database.

---

## Step 7: Check Database

Verify contacts exist in the database:

```bash
# If using SQLite
cd backend
sqlite3 prospector.db

# Run query
SELECT c.id, c.first_name, c.last_name, c.email, co.name as company_name
FROM contacts c
JOIN companies co ON c.company_id = co.id
LIMIT 5;

# Exit
.quit
```

---

## Step 8: Restart Everything

Sometimes a clean restart fixes issues:

```bash
# Stop all processes (Ctrl+C in terminals)

# Clear any cached data
cd frontend
rm -rf node_modules/.vite

# Restart backend
cd ../backend
npm start

# In a new terminal, restart frontend
cd frontend
npm run dev
```

---

## Common Issues and Solutions

### Issue: Button is disabled
**Cause:** No contacts selected
**Solution:** Click checkboxes to select contacts first

### Issue: Download starts but file is empty
**Cause:** Backend returned error as JSON instead of CSV
**Solution:** Check Network tab response. Backend might be returning an error.

### Issue: CSV downloads but won't open
**Cause:** File might be corrupted or have wrong encoding
**Solution:** 
1. Open file in a text editor (not Excel)
2. Verify it starts with: `FirstName,LastName,Email,Company`
3. Check for any HTML error messages in the file

### Issue: "Exporting..." never finishes
**Cause:** Request is hanging or timing out
**Solution:**
1. Check backend is running
2. Check network connectivity
3. Try with fewer contacts

### Issue: Works for some contacts but not others
**Cause:** Some contacts might have NULL company_id
**Solution:** The SQL query uses INNER JOIN, so contacts without companies won't be exported. This is by design since Company is a required field.

---

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Backend server is running (check terminal)
- [ ] Frontend dev server is running (check terminal)
- [ ] You are logged in (check navbar)
- [ ] Contacts are visible on the page
- [ ] At least one contact is selected (checkbox checked)
- [ ] Export button shows count > 0
- [ ] Export button is not disabled
- [ ] No errors in browser console
- [ ] No errors in backend terminal
- [ ] Network request to `/api/contacts/export` appears in Network tab
- [ ] Response status is 200 OK

---

## Still Not Working?

If you've tried all the above and it still doesn't work:

1. **Check the exact error message** in the browser console
2. **Check the backend logs** for detailed error information
3. **Verify the syntax fix** was applied correctly (no extra closing braces)
4. **Try with a fresh browser session** (clear cache, or use incognito mode)
5. **Check file permissions** on the backend directory

---

## Getting More Help

When asking for help, provide:

1. **Exact error message** from browser console
2. **Backend error logs** from terminal
3. **Network tab screenshot** showing the failed request
4. **Request payload** from Network tab
5. **Response** from Network tab
6. **Browser and version** you're using
7. **Operating system**

This information will help diagnose the issue quickly.

---

## Prevention

To avoid issues in the future:

1. Always check browser console for errors
2. Keep backend and frontend servers running
3. Restart servers after code changes
4. Test with a small selection first
5. Verify you're logged in before exporting