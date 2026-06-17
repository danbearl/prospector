# CSV Export Feature - Testing Guide

## Prerequisites

Before testing, ensure the application is running:

```bash
# Start the backend (from project root)
cd backend
npm start

# Start the frontend (from project root, in a new terminal)
cd frontend
npm run dev
```

Or use the provided startup scripts:
- Windows: `start-dev.bat`
- Linux/Mac: `./start-dev.sh`

## Test Scenarios

### 1. Basic Selection and Export

**Steps:**
1. Navigate to the Contacts page
2. Verify the checkbox column appears as the first column
3. Click the checkbox next to a single contact
4. Verify the "Export Selected (1)" button is enabled
5. Click the "Export Selected (1)" button
6. Verify a CSV file downloads with the name format: `contacts-export-YYYY-MM-DD.csv`
7. Open the CSV file and verify it contains:
   - Header row: `FirstName,LastName,Email,Company`
   - One data row with the selected contact's information

**Expected Result:** ✅ CSV file downloads with correct data

---

### 2. Multiple Contact Selection

**Steps:**
1. Navigate to the Contacts page
2. Select 3-5 contacts by clicking their checkboxes
3. Verify the button shows "Export Selected (N)" where N is the count
4. Click the export button
5. Open the downloaded CSV file

**Expected Result:** ✅ CSV contains all selected contacts, sorted by last name then first name

---

### 3. Select All Functionality

**Steps:**
1. Navigate to the Contacts page
2. Click the checkbox in the table header (Select All)
3. Verify all visible contacts are selected
4. Verify the button shows the correct count
5. Click the export button
6. Verify all contacts are exported

**Expected Result:** ✅ All visible contacts are selected and exported

---

### 4. Deselect All

**Steps:**
1. Select all contacts using the header checkbox
2. Click the header checkbox again
3. Verify all contacts are deselected
4. Verify the export button is disabled

**Expected Result:** ✅ All selections cleared, button disabled

---

### 5. Export Button States

**Steps:**
1. With no contacts selected, verify the button shows "Export Selected (0)" and is disabled
2. Select one contact, verify button is enabled
3. Click export, verify button shows "Exporting..." during the process
4. After export completes, verify selections are cleared

**Expected Result:** ✅ Button states change appropriately

---

### 6. CSV Special Characters Handling

**Steps:**
1. Create or edit a contact with special characters:
   - First Name: `John "Johnny"`
   - Last Name: `O'Brien, Jr.`
   - Email: `john.obrien@example.com`
   - Company: `Smith & Sons, LLC`
2. Select and export this contact
3. Open the CSV in a text editor (not Excel)
4. Verify proper CSV escaping:
   - Values with commas are wrapped in quotes
   - Quotes within values are doubled (`""`)

**Expected CSV Content:**
```csv
FirstName,LastName,Email,Company
"John ""Johnny""","O'Brien, Jr.",john.obrien@example.com,"Smith & Sons, LLC"
```

**Expected Result:** ✅ Special characters are properly escaped

---

### 7. Empty Email Field

**Steps:**
1. Create a contact without an email address
2. Select and export this contact
3. Verify the Email column is empty (not "null" or "undefined")

**Expected CSV Content:**
```csv
FirstName,LastName,Email,Company
John,Doe,,Acme Corp
```

**Expected Result:** ✅ Empty email shows as empty string

---

### 8. Export with Filters Applied

**Steps:**
1. Apply filters to show only certain contacts (e.g., by company or tag)
2. Use "Select All" to select all filtered contacts
3. Export the selection
4. Verify only the filtered contacts are exported

**Expected Result:** ✅ Only filtered/visible contacts are exported

---

### 9. Large Selection (Performance Test)

**Steps:**
1. If you have many contacts (50+), select all
2. Click export
3. Verify the export completes without errors
4. Verify the CSV file is valid and complete

**Expected Result:** ✅ Large exports work smoothly

---

### 10. Security Test - User Isolation

**Steps:**
1. Log in as User A
2. Note the contact IDs (visible in browser dev tools network tab)
3. Log out and log in as User B
4. Try to export contacts (normal flow)
5. Verify User B only sees and can export their own contacts

**Backend Security Check:**
- The backend endpoint filters by `user_id`
- Users cannot export other users' contacts even if they know the IDs

**Expected Result:** ✅ Users can only export their own contacts

---

## Browser Compatibility Testing

Test the export functionality in:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Expected Result:** CSV download works in all browsers

---

## Mail-Merge Compatibility Testing

### Test with Microsoft Word Mail Merge

**Steps:**
1. Export contacts to CSV
2. Open Microsoft Word
3. Go to Mailings > Start Mail Merge > Letters
4. Click "Select Recipients" > "Use an Existing List"
5. Select the exported CSV file
6. Insert merge fields (FirstName, LastName, Email, Company)
7. Preview results

**Expected Result:** ✅ All fields populate correctly in Word

### Test with Google Sheets

**Steps:**
1. Export contacts to CSV
2. Open Google Sheets
3. File > Import > Upload the CSV
4. Verify all data imports correctly with proper column headers

**Expected Result:** ✅ Data imports cleanly into Google Sheets

### Test with Excel

**Steps:**
1. Export contacts to CSV
2. Open the CSV in Microsoft Excel
3. Verify:
   - Column headers are correct
   - Data is in the right columns
   - Special characters display correctly
   - No extra quotes or escaping visible

**Expected Result:** ✅ Data displays correctly in Excel

---

## Error Handling Tests

### 1. No Contacts Selected

**Steps:**
1. Click export button without selecting any contacts
2. Verify button is disabled (cannot click)

**Expected Result:** ✅ Button is disabled when no selection

---

### 2. Network Error

**Steps:**
1. Stop the backend server
2. Select contacts and try to export
3. Verify an error message is displayed

**Expected Result:** ✅ User-friendly error message shown

---

### 3. Invalid Contact IDs (Backend Test)

**Steps:**
1. Use browser dev tools to manually call the API with invalid IDs
2. Send: `POST /api/contacts/export` with `{"contact_ids": [99999]}`
3. Verify backend returns 404 error

**Expected Result:** ✅ Backend validates contact ownership

---

## Regression Testing

After implementing CSV export, verify these existing features still work:

- ✅ View contacts list
- ✅ Add new contact
- ✅ Edit contact
- ✅ Delete contact
- ✅ Filter contacts
- ✅ Sort contacts
- ✅ View contact details
- ✅ Navigate between pages

---

## Performance Benchmarks

| Contacts | Export Time | File Size |
|----------|-------------|-----------|
| 10       | < 1 second  | ~1 KB     |
| 50       | < 1 second  | ~5 KB     |
| 100      | < 2 seconds | ~10 KB    |
| 500      | < 5 seconds | ~50 KB    |
| 1000     | < 10 seconds| ~100 KB   |

**Note:** Backend has a 1000 contact limit per export

---

## Known Limitations

1. **Maximum Export Size:** 1000 contacts per export (configurable in backend)
2. **Browser Download Limits:** Very large files may trigger browser download warnings
3. **UTF-8 Encoding:** CSV uses UTF-8; some older Excel versions may need import wizard

---

## Troubleshooting

### CSV Opens with Garbled Text in Excel

**Solution:** 
- Open Excel first
- Use Data > From Text/CSV
- Select UTF-8 encoding

### Download Doesn't Start

**Solution:**
- Check browser console for errors
- Verify backend is running
- Check network tab for API response

### Wrong Contacts Exported

**Solution:**
- Verify you're logged in as the correct user
- Check that filters aren't hiding contacts
- Clear selection and try again

---

## Test Checklist Summary

- [ ] Single contact export works
- [ ] Multiple contact export works
- [ ] Select All works
- [ ] Deselect All works
- [ ] Button states are correct
- [ ] Special characters are escaped properly
- [ ] Empty emails handled correctly
- [ ] Export with filters works
- [ ] Large selections work
- [ ] User isolation is enforced
- [ ] Works in Chrome/Edge
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works on mobile
- [ ] Compatible with Word mail merge
- [ ] Compatible with Google Sheets
- [ ] Compatible with Excel
- [ ] Error handling works
- [ ] No regression in existing features

---

## Manual Testing Instructions

1. **Start the application** using the development scripts
2. **Log in** with a test user account
3. **Create test data** if needed (contacts with various data)
4. **Run through each test scenario** above
5. **Check off items** in the test checklist
6. **Document any issues** found
7. **Verify fixes** and re-test

---

## Automated Testing (Future Enhancement)

Consider adding these automated tests:

```javascript
// Example Jest test for CSV generation
describe('CSV Export', () => {
  test('generates valid CSV with headers', () => {
    const contacts = [
      { first_name: 'John', last_name: 'Doe', email: 'john@example.com', company_name: 'Acme' }
    ];
    const csv = generateCSV(contacts);
    expect(csv).toContain('FirstName,LastName,Email,Company');
    expect(csv).toContain('John,Doe,john@example.com,Acme');
  });

  test('escapes special characters', () => {
    const contacts = [
      { first_name: 'John', last_name: 'O\'Brien, Jr.', email: 'john@example.com', company_name: 'Smith & Sons' }
    ];
    const csv = generateCSV(contacts);
    expect(csv).toContain('"O\'Brien, Jr."');
    expect(csv).toContain('"Smith & Sons"');
  });
});
```

---

## Success Criteria

The CSV export feature is considered complete and working when:

✅ All test scenarios pass
✅ No regressions in existing functionality
✅ CSV files are compatible with common mail-merge tools
✅ Security validation prevents unauthorized access
✅ Performance is acceptable for typical use cases
✅ Error handling provides clear user feedback