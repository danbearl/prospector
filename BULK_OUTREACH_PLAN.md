# Bulk Outreach Feature - Implementation Plan

## Overview
Add functionality to create multiple outreach entries from a single form submission by allowing users to select multiple contacts. Each selected contact will receive an identical outreach entry with the same details (type, date, subject, notes, outcome, follow-up date, and campaign assignments).

## User Requirements
1. **Contact Selection**: Dropdown with "+" button to add contacts, displaying selected contacts as removable chips/tags
2. **Follow-up Dates**: Same follow-up date applied to all contacts (if specified)
3. **User Feedback**: Simple success message showing count (e.g., "Successfully created 5 outreach entries")

## Current Architecture Analysis

### Frontend (LogOutreachModal.jsx)
- **Current State**: Single contact selection via dropdown
- **Current Flow**: 
  1. User selects one contact from dropdown
  2. Fills out outreach details
  3. Submits form → calls `createOutreach(contactId, data)`
  4. Creates one outreach entry

### Backend (server.js)
- **Current Endpoint**: `POST /api/contacts/:id/outreach`
- **Current Logic**:
  1. Accepts contact ID in URL parameter
  2. Creates single outreach entry in `outreach_history` table
  3. Handles campaign assignments via `outreach_campaigns` junction table
  4. Supports creating new campaigns on-the-fly

### Database Schema
- **outreach_history**: Stores individual outreach records (one per contact)
- **outreach_campaigns**: Junction table linking outreach to campaigns (many-to-many)
- All tables include `user_id` for multi-user support

## Implementation Plan

### 1. Backend Changes

#### 1.1 Create New Bulk Outreach Endpoint
**File**: `backend/server.js`

**New Endpoint**: `POST /api/outreach/bulk`

**Request Body**:
```json
{
  "contact_ids": [1, 2, 3],
  "outreach_type": "Email",
  "outreach_date": "2026-06-23",
  "subject": "Follow-up on proposal",
  "notes": "Sent follow-up email",
  "outcome": "Awaiting response",
  "follow_up_date": "2026-06-30",
  "campaign_ids": [1, 2],
  "new_campaign": { "name": "Q2 Campaign", "description": "..." }
}
```

**Implementation Steps**:
1. Add endpoint after existing outreach routes (around line 1327)
2. Validate `contact_ids` array is not empty
3. Use database transaction to ensure atomicity
4. For each contact ID:
   - Create outreach entry in `outreach_history`
   - Link to campaigns via `outreach_campaigns`
5. Handle new campaign creation once (if provided)
6. Return success count and created outreach IDs

**Response**:
```json
{
  "success": true,
  "count": 3,
  "outreach_ids": [101, 102, 103]
}
```

**Error Handling**:
- Validate all contact IDs belong to the user
- Use transaction rollback on any failure
- Return appropriate error messages

### 2. Frontend API Changes

#### 2.1 Add Bulk Outreach API Function
**File**: `frontend/src/api.js`

Add new function:
```javascript
export const createBulkOutreach = (data) => api.post('/outreach/bulk', data);
```

### 3. Frontend Component Changes

#### 3.1 Update LogOutreachModal Component
**File**: `frontend/src/components/LogOutreachModal.jsx`

**State Changes**:
```javascript
const [formData, setFormData] = useState({
  contact_ids: [],           // Changed from contact_id (single) to contact_ids (array)
  selected_contact_id: '',   // New: for dropdown selection
  outreach_type: 'Email',
  // ... rest remains the same
});
```

**UI Changes**:

1. **Contact Selection Section** (replace lines 127-142):
   ```jsx
   <div className="form-group">
     <label>Contacts *</label>
     
     {/* Selected contacts display */}
     {formData.contact_ids.length > 0 && (
       <div className="selected-contacts">
         {formData.contact_ids.map(contactId => {
           const contact = contacts.find(c => c.id === contactId);
           return (
             <div key={contactId} className="contact-chip">
               <span>{contact.first_name} {contact.last_name}</span>
               <button 
                 type="button" 
                 onClick={() => removeContact(contactId)}
                 className="remove-chip"
               >
                 ×
               </button>
             </div>
           );
         })}
       </div>
     )}
     
     {/* Add contact dropdown */}
     <div className="add-contact-row">
       <select
         value={formData.selected_contact_id}
         onChange={(e) => setFormData({ ...formData, selected_contact_id: e.target.value })}
         disabled={Boolean(initialContactId)}
       >
         <option value="">Select a contact to add</option>
         {contacts
           .filter(c => !formData.contact_ids.includes(c.id))
           .map(contact => (
             <option key={contact.id} value={contact.id}>
               {contact.first_name} {contact.last_name} - {contact.company_name || 'No Company'}
             </option>
           ))}
       </select>
       <button
         type="button"
         className="btn btn-secondary"
         onClick={addContact}
         disabled={!formData.selected_contact_id}
       >
         + Add
       </button>
     </div>
   </div>
   ```

2. **Helper Functions**:
   ```javascript
   const addContact = () => {
     if (formData.selected_contact_id && !formData.contact_ids.includes(parseInt(formData.selected_contact_id))) {
       setFormData({
         ...formData,
         contact_ids: [...formData.contact_ids, parseInt(formData.selected_contact_id)],
         selected_contact_id: ''
       });
     }
   };

   const removeContact = (contactId) => {
     setFormData({
       ...formData,
       contact_ids: formData.contact_ids.filter(id => id !== contactId)
     });
   };
   ```

3. **Submit Handler Update** (replace lines 55-102):
   ```javascript
   const handleSubmit = async (e) => {
     e.preventDefault();
     
     if (formData.contact_ids.length === 0) {
       alert('Please select at least one contact');
       return;
     }

     try {
       setSubmitting(true);
       
       // Prepare outreach data
       const outreachData = {
         contact_ids: formData.contact_ids,
         outreach_type: formData.outreach_type,
         outreach_date: formData.outreach_date,
         subject: formData.subject,
         notes: formData.notes,
         outcome: formData.outcome,
         follow_up_date: formData.follow_up_date || null,
         campaign_ids: formData.campaign_ids,
         new_campaign: showNewCampaignForm ? formData.new_campaign : null
       };
       
       // Call bulk API
       const response = await createBulkOutreach(outreachData);
       
       // Handle follow-up closure if needed
       if (completedFollowUpId) {
         await closeOutreachFollowUp(completedFollowUpId);
       }
       
       // Show success message with count
       const count = response.data.count;
       alert(`Successfully created ${count} outreach ${count === 1 ? 'entry' : 'entries'}`);
       
       // Reset form
       setFormData({
         contact_ids: [],
         selected_contact_id: '',
         outreach_type: 'Email',
         outreach_date: new Date().toISOString().split('T')[0],
         subject: '',
         notes: '',
         outcome: '',
         follow_up_date: '',
         campaign_ids: [],
         new_campaign: { name: '', description: '' }
       });
       setShowNewCampaignForm(false);
       
       if (onSuccess) onSuccess();
       onClose();
     } catch (error) {
       console.error('Error creating outreach:', error);
       alert('Failed to log outreach');
     } finally {
       setSubmitting(false);
     }
   };
   ```

4. **Initialize with initialContactId** (update useEffect around line 29):
   ```javascript
   useEffect(() => {
     if (isOpen && initialContactId) {
       setFormData(prev => ({
         ...prev,
         contact_ids: [parseInt(initialContactId)],
         selected_contact_id: ''
       }));
     }
   }, [isOpen, initialContactId]);
   ```

### 4. CSS Styling

#### 4.1 Add Styles for Contact Chips
**File**: `frontend/src/index.css`

Add styles for the new contact selection UI:
```css
.selected-contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  min-height: 40px;
}

.contact-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background-color: #007bff;
  color: white;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
}

.contact-chip .remove-chip {
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.contact-chip .remove-chip:hover {
  opacity: 1;
}

.add-contact-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.add-contact-row select {
  flex: 1;
}

.add-contact-row .btn {
  white-space: nowrap;
  padding: 0.5rem 1rem;
}
```

## Testing Plan

### Test Scenarios

1. **Single Contact (Backward Compatibility)**
   - Add one contact
   - Fill out form
   - Submit
   - Verify one outreach entry created
   - Verify success message shows "1 entry"

2. **Multiple Contacts**
   - Add 3-5 contacts
   - Fill out form with all fields
   - Submit
   - Verify correct number of entries created
   - Verify all entries have identical data
   - Verify success message shows correct count

3. **Contact Management**
   - Add contact
   - Remove contact
   - Add same contact again (should work)
   - Verify no duplicates in selection

4. **Campaign Assignments**
   - Select multiple contacts
   - Assign to existing campaigns
   - Submit
   - Verify all outreach entries linked to campaigns

5. **New Campaign Creation**
   - Select multiple contacts
   - Create new campaign
   - Submit
   - Verify campaign created once
   - Verify all outreach entries linked to new campaign

6. **Follow-up Dates**
   - Select multiple contacts
   - Set follow-up date
   - Submit
   - Verify all entries have same follow-up date

7. **Error Handling**
   - Try to submit with no contacts selected
   - Verify validation error
   - Test with invalid contact IDs
   - Test with network errors

8. **Initial Contact ID (from ContactDetail)**
   - Open modal with initialContactId
   - Verify contact pre-selected
   - Verify can add more contacts
   - Submit and verify

## Migration Considerations

- **Backward Compatibility**: Existing single-contact flow remains functional
- **Database**: No schema changes required
- **API**: New endpoint doesn't affect existing endpoint
- **UI**: Changes are contained within LogOutreachModal component

## Success Criteria

✅ Users can select multiple contacts using dropdown + "Add" button
✅ Selected contacts display as removable chips
✅ Form submission creates one outreach entry per selected contact
✅ All entries share the same outreach details
✅ Campaign assignments work correctly for all entries
✅ Success message shows accurate count
✅ Single-contact flow still works (backward compatible)
✅ Error handling provides clear feedback
✅ UI is responsive and matches existing design

## Implementation Order

1. Backend bulk endpoint (most critical, enables testing)
2. Frontend API function (simple addition)
3. Frontend component state changes (foundation for UI)
4. Frontend UI changes (contact selection interface)
5. CSS styling (polish)
6. Testing (validation)

## Estimated Complexity

- **Backend**: Low-Medium (transaction handling, validation)
- **Frontend Logic**: Medium (state management, array operations)
- **Frontend UI**: Medium (new interaction pattern)
- **CSS**: Low (straightforward styling)
- **Testing**: Medium (multiple scenarios to cover)

**Total Effort**: Medium complexity feature, approximately 4-6 hours of development time.