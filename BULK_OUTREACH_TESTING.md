# Bulk Outreach Feature - Testing Guide

## Overview
This document provides testing instructions for the new bulk outreach feature that allows creating multiple outreach entries from a single form submission.

## Test Environment Setup

### Prerequisites
1. Application running (backend and frontend)
2. At least one user account created
3. Multiple contacts created (at least 5 for comprehensive testing)
4. At least one campaign created (optional, for campaign testing)

### Quick Setup Commands
```bash
# Start the application
npm run dev  # or your start command

# Access the application
# Navigate to http://localhost:3000 (or your configured port)
```

## Test Scenarios

### Test 1: Single Contact (Backward Compatibility)
**Purpose**: Verify existing single-contact flow still works

**Steps**:
1. Navigate to Contacts page
2. Click "Log Outreach" button
3. Add ONE contact using the dropdown and "+ Add" button
4. Fill out outreach details:
   - Type: Email
   - Date: Today's date
   - Subject: "Test single contact"
   - Notes: "Testing backward compatibility"
5. Click "Log Outreach"

**Expected Results**:
- ✅ Contact appears as a chip after clicking "+ Add"
- ✅ Form submits successfully
- ✅ Success message: "Successfully created 1 outreach entry"
- ✅ Modal closes
- ✅ One new outreach entry appears in the contact's history

---

### Test 2: Multiple Contacts (Core Feature)
**Purpose**: Verify bulk outreach creation works

**Steps**:
1. Click "Log Outreach" button
2. Add 3-5 contacts using the dropdown and "+ Add" button
3. Fill out outreach details:
   - Type: Phone
   - Date: Today's date
   - Subject: "Bulk outreach test"
   - Notes: "Testing multiple contacts"
   - Outcome: "Left voicemail"
4. Click "Log Outreach"

**Expected Results**:
- ✅ Each contact appears as a chip after clicking "+ Add"
- ✅ Dropdown filters out already-selected contacts
- ✅ Form submits successfully
- ✅ Success message shows correct count (e.g., "Successfully created 3 outreach entries")
- ✅ Modal closes
- ✅ Each selected contact has a new outreach entry with identical data

---

### Test 3: Contact Management
**Purpose**: Verify adding and removing contacts works correctly

**Steps**:
1. Click "Log Outreach" button
2. Add a contact (Contact A)
3. Add another contact (Contact B)
4. Remove Contact A by clicking the × button
5. Try to add Contact A again
6. Verify Contact A appears in dropdown after removal
7. Add Contact A again

**Expected Results**:
- ✅ Contacts appear as chips when added
- ✅ Clicking × removes the contact chip
- ✅ Removed contact reappears in dropdown
- ✅ Can re-add previously removed contacts
- ✅ No duplicate contacts in selection

---

### Test 4: Campaign Assignments
**Purpose**: Verify campaign linking works with bulk outreach

**Steps**:
1. Click "Log Outreach" button
2. Add 2-3 contacts
3. Fill out outreach details
4. Select 1-2 existing campaigns (check the campaign checkboxes)
5. Click "Log Outreach"
6. Verify each contact's outreach entry

**Expected Results**:
- ✅ Form submits successfully
- ✅ Success message shows correct count
- ✅ Each outreach entry is linked to the selected campaigns
- ✅ Campaign associations visible in outreach history

---

### Test 5: New Campaign Creation
**Purpose**: Verify creating a new campaign with bulk outreach

**Steps**:
1. Click "Log Outreach" button
2. Add 2-3 contacts
3. Fill out outreach details
4. Check "Create new campaign"
5. Enter campaign details:
   - Name: "Test Bulk Campaign"
   - Description: "Created during bulk outreach test"
6. Click "Log Outreach"
7. Navigate to Campaigns page

**Expected Results**:
- ✅ Form submits successfully
- ✅ New campaign is created (appears in Campaigns page)
- ✅ All outreach entries are linked to the new campaign
- ✅ Campaign is created only once (not duplicated per contact)

---

### Test 6: Follow-up Dates
**Purpose**: Verify follow-up dates are applied to all contacts

**Steps**:
1. Click "Log Outreach" button
2. Add 3 contacts
3. Fill out outreach details
4. Set a follow-up date (e.g., 7 days from now)
5. Click "Log Outreach"
6. Check each contact's outreach entry

**Expected Results**:
- ✅ Form submits successfully
- ✅ All outreach entries have the same follow-up date
- ✅ Follow-up appears in dashboard/follow-ups list for each contact

---

### Test 7: Validation - No Contacts Selected
**Purpose**: Verify validation prevents submission without contacts

**Steps**:
1. Click "Log Outreach" button
2. Do NOT add any contacts
3. Fill out other outreach details
4. Click "Log Outreach"

**Expected Results**:
- ✅ Alert appears: "Please select at least one contact"
- ✅ Form does not submit
- ✅ Modal remains open

---

### Test 8: Initial Contact ID (from Contact Detail)
**Purpose**: Verify pre-selection from contact detail page works

**Steps**:
1. Navigate to a specific contact's detail page
2. Click "Log Outreach" button on that page
3. Verify the contact is pre-selected
4. Add 2 more contacts
5. Fill out outreach details
6. Click "Log Outreach"

**Expected Results**:
- ✅ Initial contact appears as a chip automatically
- ✅ Can add additional contacts
- ✅ All contacts (including initial) receive outreach entries
- ✅ Success message shows correct total count

---

### Test 9: Dropdown Filtering
**Purpose**: Verify dropdown only shows unselected contacts

**Steps**:
1. Click "Log Outreach" button
2. Note the number of contacts in dropdown
3. Add a contact
4. Open dropdown again
5. Verify the added contact is not in the list
6. Add another contact
7. Open dropdown again

**Expected Results**:
- ✅ Dropdown initially shows all contacts
- ✅ After adding a contact, it disappears from dropdown
- ✅ Dropdown count decreases as contacts are added
- ✅ Only unselected contacts appear in dropdown

---

### Test 10: Form Reset
**Purpose**: Verify form resets properly after submission

**Steps**:
1. Click "Log Outreach" button
2. Add 2-3 contacts
3. Fill out all fields (including campaigns, follow-up date)
4. Submit form
5. Open "Log Outreach" modal again

**Expected Results**:
- ✅ Contact selection is empty
- ✅ Dropdown shows all contacts again
- ✅ All form fields are reset to defaults
- ✅ Campaign selections are cleared
- ✅ Date is set to today

---

### Test 11: Error Handling - Invalid Contact
**Purpose**: Verify backend validation works

**Steps**:
1. Use browser dev tools to inspect the form
2. Manually modify the contact_ids array to include an invalid ID
3. Submit the form

**Expected Results**:
- ✅ Backend returns error
- ✅ Alert shows: "Failed to log outreach"
- ✅ No outreach entries are created
- ✅ Modal remains open

---

### Test 12: Large Selection (Performance)
**Purpose**: Verify performance with many contacts

**Steps**:
1. Click "Log Outreach" button
2. Add 10-15 contacts (if available)
3. Fill out outreach details
4. Click "Log Outreach"
5. Wait for completion

**Expected Results**:
- ✅ UI remains responsive while adding contacts
- ✅ Form submits successfully
- ✅ Success message shows correct count
- ✅ All outreach entries are created
- ✅ Reasonable response time (< 5 seconds)

---

## Visual/UI Tests

### Test 13: Contact Chip Styling
**Purpose**: Verify visual appearance of contact chips

**Checks**:
- ✅ Chips have blue background (#3498db)
- ✅ White text is readable
- ✅ Chips have rounded corners (pill shape)
- ✅ × button is visible and properly positioned
- ✅ × button becomes more opaque on hover
- ✅ Chips wrap to multiple rows if needed

---

### Test 14: Responsive Design
**Purpose**: Verify layout works on different screen sizes

**Steps**:
1. Open modal on desktop (> 768px)
2. Add several contacts
3. Resize browser to tablet size
4. Resize to mobile size

**Expected Results**:
- ✅ Chips wrap appropriately on smaller screens
- ✅ Dropdown and "+ Add" button remain usable
- ✅ No horizontal scrolling required
- ✅ All elements remain accessible

---

### Test 15: Accessibility
**Purpose**: Verify keyboard navigation and screen reader support

**Steps**:
1. Open modal
2. Use Tab key to navigate through form
3. Use Enter/Space to add contacts
4. Use keyboard to remove contacts
5. Test with screen reader (if available)

**Expected Results**:
- ✅ All interactive elements are keyboard accessible
- ✅ Tab order is logical
- ✅ Remove buttons have aria-labels
- ✅ Form can be completed without mouse
- ✅ Screen reader announces contact additions/removals

---

## Integration Tests

### Test 16: Complete Follow-up with Bulk Outreach
**Purpose**: Verify follow-up completion works with bulk creation

**Steps**:
1. Create an outreach with a follow-up date in the past
2. From Dashboard, click "Complete Follow-up" on that entry
3. Add multiple contacts in the modal
4. Fill out details
5. Submit

**Expected Results**:
- ✅ Original follow-up is marked as complete
- ✅ New outreach entries created for all selected contacts
- ✅ Success message shows correct count

---

### Test 17: Mixed Campaign Selection
**Purpose**: Verify both existing and new campaigns work together

**Steps**:
1. Click "Log Outreach" button
2. Add 2-3 contacts
3. Select 1 existing campaign
4. Check "Create new campaign"
5. Enter new campaign details
6. Submit

**Expected Results**:
- ✅ New campaign is created
- ✅ All outreach entries linked to both existing and new campaigns
- ✅ No duplicate campaign entries

---

## Bug Checks

### Common Issues to Watch For
- [ ] Duplicate contacts in selection
- [ ] Contacts not removed from dropdown after selection
- [ ] Form not resetting after submission
- [ ] Incorrect count in success message
- [ ] Campaign associations not created
- [ ] Follow-up dates not applied to all entries
- [ ] Initial contact ID not working
- [ ] Validation not triggering
- [ ] UI elements overlapping or misaligned
- [ ] Performance issues with many contacts

---

## Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: ___________

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Single Contact | ☐ Pass ☐ Fail | |
| 2 | Multiple Contacts | ☐ Pass ☐ Fail | |
| 3 | Contact Management | ☐ Pass ☐ Fail | |
| 4 | Campaign Assignments | ☐ Pass ☐ Fail | |
| 5 | New Campaign Creation | ☐ Pass ☐ Fail | |
| 6 | Follow-up Dates | ☐ Pass ☐ Fail | |
| 7 | Validation | ☐ Pass ☐ Fail | |
| 8 | Initial Contact ID | ☐ Pass ☐ Fail | |
| 9 | Dropdown Filtering | ☐ Pass ☐ Fail | |
| 10 | Form Reset | ☐ Pass ☐ Fail | |
| 11 | Error Handling | ☐ Pass ☐ Fail | |
| 12 | Large Selection | ☐ Pass ☐ Fail | |
| 13 | Contact Chip Styling | ☐ Pass ☐ Fail | |
| 14 | Responsive Design | ☐ Pass ☐ Fail | |
| 15 | Accessibility | ☐ Pass ☐ Fail | |
| 16 | Complete Follow-up | ☐ Pass ☐ Fail | |
| 17 | Mixed Campaign Selection | ☐ Pass ☐ Fail | |

Overall Result: ☐ All Pass ☐ Some Failures

Issues Found:
1. 
2. 
3. 
```

---

## Automated Testing (Future Enhancement)

### Suggested Test Cases for Jest/React Testing Library

```javascript
describe('LogOutreachModal - Bulk Outreach', () => {
  test('allows adding multiple contacts', () => {
    // Test implementation
  });

  test('removes contact when × is clicked', () => {
    // Test implementation
  });

  test('filters selected contacts from dropdown', () => {
    // Test implementation
  });

  test('validates at least one contact is selected', () => {
    // Test implementation
  });

  test('displays correct success message count', () => {
    // Test implementation
  });
});
```

### Backend API Tests

```javascript
describe('POST /api/outreach/bulk', () => {
  test('creates outreach for multiple contacts', async () => {
    // Test implementation
  });

  test('validates contact ownership', async () => {
    // Test implementation
  });

  test('handles campaign assignments', async () => {
    // Test implementation
  });

  test('returns correct count', async () => {
    // Test implementation
  });
});
```

---

## Troubleshooting

### Issue: Contacts not appearing in dropdown
**Solution**: Check that contacts exist and belong to the logged-in user

### Issue: Success message shows wrong count
**Solution**: Check backend response and frontend count extraction

### Issue: Chips not styled correctly
**Solution**: Verify CSS is loaded and classes are applied correctly

### Issue: Form not submitting
**Solution**: Check browser console for errors, verify API endpoint is accessible

### Issue: Duplicate outreach entries
**Solution**: Check for duplicate contact IDs in the array

---

## Sign-off

- [ ] All critical tests passed
- [ ] No blocking issues found
- [ ] Feature ready for production

Approved by: ___________
Date: ___________