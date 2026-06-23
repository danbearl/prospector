# Bulk Outreach Feature - UI Mockup

## Current UI (Single Contact)

```
┌─────────────────────────────────────────────────────────────┐
│ Log Outreach                                           [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Contact *                                                     │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ John Smith - Acme Corp                            ▼   │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ Outreach Type *              Date *                          │
│ ┌──────────────────┐         ┌──────────────────┐           │
│ │ Email        ▼   │         │ 2026-06-23       │           │
│ └──────────────────┘         └──────────────────┘           │
│                                                               │
│ Subject                                                       │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Follow-up on proposal                                 │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ [Rest of form...]                                             │
│                                                               │
│                                    [Cancel] [Log Outreach]   │
└─────────────────────────────────────────────────────────────┘
```

## New UI (Multiple Contacts)

```
┌─────────────────────────────────────────────────────────────┐
│ Log Outreach                                           [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Contacts *                                                    │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ┌──────────────────┐ ┌──────────────────┐             │   │
│ │ │ John Smith    [×]│ │ Jane Doe      [×]│             │   │
│ │ └──────────────────┘ └──────────────────┘             │   │
│ │ ┌──────────────────┐                                   │   │
│ │ │ Bob Johnson   [×]│                                   │   │
│ │ └──────────────────┘                                   │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌─────────────────────────────────────────────┐ ┌────────┐  │
│ │ Select a contact to add                 ▼   │ │ + Add  │  │
│ └─────────────────────────────────────────────┘ └────────┘  │
│                                                               │
│ Outreach Type *              Date *                          │
│ ┌──────────────────┐         ┌──────────────────┐           │
│ │ Email        ▼   │         │ 2026-06-23       │           │
│ └──────────────────┘         └──────────────────┘           │
│                                                               │
│ Subject                                                       │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Follow-up on proposal                                 │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ [Rest of form...]                                             │
│                                                               │
│                                    [Cancel] [Log Outreach]   │
└─────────────────────────────────────────────────────────────┘
```

## UI States

### State 1: No Contacts Selected
```
┌───────────────────────────────────────────────────────────┐
│ Contacts *                                                  │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ (empty - no chips shown)                            │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────┐ ┌────────┐      │
│ │ Select a contact to add           ▼   │ │ + Add  │      │
│ └───────────────────────────────────────┘ └────────┘      │
└───────────────────────────────────────────────────────────┘
```

### State 2: One Contact Selected
```
┌───────────────────────────────────────────────────────────┐
│ Contacts *                                                  │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ┌──────────────────┐                                │   │
│ │ │ John Smith    [×]│                                │   │
│ │ └──────────────────┘                                │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────┐ ┌────────┐      │
│ │ Select a contact to add           ▼   │ │ + Add  │      │
│ └───────────────────────────────────────┘ └────────┘      │
└───────────────────────────────────────────────────────────┘
```

### State 3: Multiple Contacts Selected
```
┌───────────────────────────────────────────────────────────┐
│ Contacts *                                                  │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ┌──────────────────┐ ┌──────────────────┐           │   │
│ │ │ John Smith    [×]│ │ Jane Doe      [×]│           │   │
│ │ └──────────────────┘ └──────────────────┘           │   │
│ │ ┌──────────────────┐ ┌──────────────────┐           │   │
│ │ │ Bob Johnson   [×]│ │ Alice Brown   [×]│           │   │
│ │ └──────────────────┘ └──────────────────┘           │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────┐ ┌────────┐      │
│ │ Select a contact to add           ▼   │ │ + Add  │      │
│ └───────────────────────────────────────┘ └────────┘      │
└───────────────────────────────────────────────────────────┘
```

### State 4: Dropdown Filtered (Already Selected Contacts Hidden)
```
┌───────────────────────────────────────────────────────────┐
│ Contacts *                                                  │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ┌──────────────────┐ ┌──────────────────┐           │   │
│ │ │ John Smith    [×]│ │ Jane Doe      [×]│           │   │
│ │ └──────────────────┘ └──────────────────┘           │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────┐ ┌────────┐      │
│ │ Select a contact to add           ▼   │ │ + Add  │      │
│ │ ┌─────────────────────────────────┐   │ └────────┘      │
│ │ │ Select a contact to add         │   │                 │
│ │ │ Bob Johnson - Tech Corp         │   │  (Dropdown      │
│ │ │ Alice Brown - StartupXYZ        │   │   shows only    │
│ │ │ Charlie Davis - BigCo           │   │   unselected    │
│ │ │ ...                             │   │   contacts)     │
│ │ └─────────────────────────────────┘   │                 │
│ └───────────────────────────────────────┘                 │
└───────────────────────────────────────────────────────────┘
```

## Interaction Flow

### Adding a Contact
1. User clicks dropdown → sees list of available contacts (excluding already selected)
2. User selects a contact from dropdown
3. "+ Add" button becomes enabled
4. User clicks "+ Add" button
5. Contact appears as a chip in the selected contacts area
6. Dropdown resets to "Select a contact to add"
7. "+ Add" button becomes disabled again

### Removing a Contact
1. User clicks [×] button on a contact chip
2. Contact chip is removed from selected contacts area
3. Contact becomes available again in the dropdown

### Submitting the Form
1. User fills out all outreach details (same as before)
2. User clicks "Log Outreach" button
3. System creates one outreach entry for each selected contact
4. Success message appears: "Successfully created 3 outreach entries"
5. Modal closes

## Visual Design Details

### Contact Chips
- **Background**: Blue (#007bff)
- **Text**: White
- **Border Radius**: 16px (pill shape)
- **Padding**: 6px 12px
- **Font Size**: 14px
- **Remove Button**: White × symbol, slightly transparent, becomes opaque on hover

### Selected Contacts Container
- **Background**: Light gray (#f8f9fa)
- **Border Radius**: 4px
- **Padding**: 8px
- **Min Height**: 40px (even when empty)
- **Layout**: Flexbox with wrap, 8px gap between chips

### Add Contact Row
- **Layout**: Flexbox, dropdown takes remaining space, button fixed width
- **Gap**: 8px between dropdown and button
- **Button**: Secondary style, "+" prefix for clarity

## Responsive Behavior

### Desktop (> 768px)
- Chips wrap naturally in the container
- Dropdown and button side-by-side

### Mobile (< 768px)
- Chips wrap to multiple rows as needed
- Dropdown and button stack vertically (optional enhancement)

## Accessibility Considerations

- All interactive elements keyboard accessible
- Remove buttons have aria-labels: "Remove [Contact Name]"
- Dropdown has proper label association
- Success message announced to screen readers
- Form validation errors clearly communicated

## Success Message Examples

- Single contact: "Successfully created 1 outreach entry"
- Multiple contacts: "Successfully created 5 outreach entries"
- Error: "Failed to log outreach. Please try again."
- Validation: "Please select at least one contact"