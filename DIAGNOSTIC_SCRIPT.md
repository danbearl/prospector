# CSV Export Diagnostic Script

Since you're running in Docker containers, use this browser console script to diagnose the issue.

## How to Use

1. Open your app at `http://localhost:3000`
2. Log in to your account
3. Open Browser Developer Tools (F12)
4. Go to the **Console** tab
5. Copy and paste the script below
6. Press Enter to run it

## Diagnostic Script

```javascript
// CSV Export Diagnostic Script
console.log('=== CSV Export Diagnostic ===\n');

// Step 1: Check Authentication
console.log('1. Checking Authentication...');
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');
console.log('   Token:', token ? '✓ Present' : '✗ MISSING');
console.log('   User:', user ? '✓ Present' : '✗ MISSING');
if (!token) {
    console.error('   ERROR: No auth token! Please log in first.');
}
console.log('');

// Step 2: Check Backend Connection
console.log('2. Checking Backend Connection...');
fetch('/api/tags', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(response => {
    console.log('   Backend Status:', response.status, response.statusText);
    console.log('   Backend:', response.ok ? '✓ RUNNING' : '✗ ERROR');
    return response.ok;
})
.then(ok => {
    if (!ok) {
        console.error('   ERROR: Backend not responding correctly!');
    }
    console.log('');
    
    // Step 3: Test CSV Export Endpoint
    console.log('3. Testing CSV Export Endpoint...');
    console.log('   Sending test request with contact IDs: [1, 2, 3]');
    
    return fetch('/api/contacts/export', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contact_ids: [1, 2, 3] })
    });
})
.then(response => {
    console.log('   Export Status:', response.status, response.statusText);
    console.log('   Content-Type:', response.headers.get('content-type'));
    
    if (response.status === 200) {
        console.log('   ✓ SUCCESS! Endpoint is working.');
        return response.text().then(text => {
            console.log('   CSV Preview (first 200 chars):');
            console.log('   ' + text.substring(0, 200));
        });
    } else if (response.status === 404) {
        console.error('   ✗ ERROR: Endpoint not found (404)');
        console.error('   → Backend needs to be restarted to load the new endpoint');
        return response.text().then(text => console.error('   Response:', text));
    } else if (response.status === 400) {
        return response.json().then(data => {
            console.error('   ✗ ERROR:', data.error);
            if (data.error === 'No contact IDs provided') {
                console.error('   → This is expected for test IDs that don\'t exist');
            }
        });
    } else if (response.status === 401) {
        console.error('   ✗ ERROR: Unauthorized (401)');
        console.error('   → Token expired or invalid. Log out and log back in.');
    } else {
        return response.text().then(text => {
            console.error('   ✗ ERROR:', text);
        });
    }
})
.catch(error => {
    console.error('   ✗ NETWORK ERROR:', error.message);
    console.error('   → Backend may be offline or unreachable');
})
.finally(() => {
    console.log('\n=== Diagnostic Complete ===');
    console.log('\nNext Steps:');
    console.log('1. If you see "404 Endpoint not found" → Restart backend container');
    console.log('2. If you see "401 Unauthorized" → Log out and log back in');
    console.log('3. If you see "No contacts found" → Try with real contact IDs');
    console.log('4. If you see "SUCCESS" → The endpoint works! Check frontend code.');
});
```

## What the Results Mean

### ✓ SUCCESS Scenarios

**"✓ SUCCESS! Endpoint is working"**
- The backend endpoint is working correctly
- The issue is in the frontend code
- Check that contacts are being selected properly

### ✗ ERROR Scenarios

**"✗ ERROR: Endpoint not found (404)"**
- **Cause**: Backend container hasn't been restarted
- **Solution**: Restart the backend container:
  ```bash
  docker-compose restart backend
  # or
  docker-compose down
  docker-compose up -d
  ```

**"✗ ERROR: Unauthorized (401)"**
- **Cause**: Auth token expired or invalid
- **Solution**: Log out and log back in

**"✗ ERROR: No contact IDs provided"**
- **Cause**: Test IDs don't exist in your database
- **Solution**: This is normal for the test. Try with real contact IDs from your database

**"✗ NETWORK ERROR"**
- **Cause**: Backend container is not running
- **Solution**: Start the containers:
  ```bash
  docker-compose up -d
  ```

## Testing with Real Contact IDs

Once the endpoint is confirmed working, test with real contact IDs:

```javascript
// Get real contact IDs from the page
const contactIds = Array.from(document.querySelectorAll('.contacts-table tbody tr'))
    .slice(0, 3)  // Get first 3 contacts
    .map(row => parseInt(row.querySelector('input[type="checkbox"]')?.value || 0))
    .filter(id => id > 0);

console.log('Real Contact IDs:', contactIds);

// Test export with real IDs
fetch('/api/contacts/export', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ contact_ids: contactIds })
})
.then(response => response.text())
.then(csv => {
    console.log('CSV Output:');
    console.log(csv);
})
.catch(error => console.error('Error:', error));
```

## Most Likely Issue

Since you're running in Docker, the **most likely issue** is:

**The backend container needs to be restarted** to load the new CSV export endpoint.

Run this command:
```bash
docker-compose restart backend
```

Then try the export feature again!