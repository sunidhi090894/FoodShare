# Donor Dashboard - Active Surplus Offers Table Visual Guide

## Table Display

### Before MATCHED (Status: OPEN)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Items | Pickup Window | Status | Actions                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 30kg │ Today 2-4 PM  │ OPEN   │ ┌────────────────────────────────┐        │
│ Rice │               │        │ │ [View Requests] [Edit] [Cancel] │        │
│      │               │        │ └────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### After MATCHED (Status: MATCHED)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Items | Pickup Window | Status  | Actions                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 30kg │ Today 2-4 PM  │ MATCHED │ Accepted by:                              │
│ Rice │               │         │ Hope Shelter Trust                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed View

### OPEN Status Offer
```
Items:                20kg Biryani
Pickup Window:        Today · 2:00 PM – 4:00 PM
Pickup Address:       Bandra West · 4th Road
Status:               OPEN (blue badge)

Actions:
┌─────────────────────┬──────────┬──────────┐
│ View Requests       │   Edit   │  Cancel  │
└─────────────────────┴──────────┴──────────┘
```

### MATCHED Status Offer
```
Items:                20kg Biryani
Pickup Window:        Today · 2:00 PM – 4:00 PM
Pickup Address:       Bandra West · 4th Road
Status:               MATCHED (secondary badge)

Actions:
┌─────────────────────────────┐
│ Accepted by:                │
│ Hope Shelter Trust          │
└─────────────────────────────┘
(Read-only, no buttons)
```

---

## Color & Styling Reference

### Text Colors
- **Accepted by:**: `text-[#4a1f1f]` (Dark Brown) - Bold
- **Organization Name**: `text-[#6b4d3c]` (Medium Brown)
- **Font Size**: Small (`text-sm`)
- **Weight**: Semi-bold for label

### Badge Colors
- **OPEN**: Secondary variant (light brown)
- **MATCHED**: Secondary variant (light brown)
- **FULFILLED**: Success variant (green)
- **EXPIRED**: Warning variant (orange)
- **CANCELLED**: Destructive variant (red)

---

## User Experience Flow

### Donor's Perspective

1. **Post Surplus Offer** (Status: OPEN)
   ```
   Actions Available: View Requests, Edit, Cancel
   → Donor can manage the offer
   ```

2. **Recipient Requests** (Status: OPEN → PENDING)
   ```
   Actions Available: View Requests, Edit, Cancel
   → Donor can review incoming requests
   ```

3. **Donor Approves Request** (Status: OPEN → MATCHED)
   ```
   Actions Available: NONE (Read-only)
   Display: "Accepted by: Hope Shelter Trust"
   → Donation is committed to recipient
   → No further edits allowed
   ```

4. **Volunteer Completes Delivery** (Status: MATCHED → FULFILLED)
   ```
   Actions Available: View Requests, Edit
   Display: Action buttons return
   → Delivery confirmed
   ```

---

## Implementation Checklist

- ✅ Conditional rendering based on `offer.status === 'MATCHED'`
- ✅ Display "Accepted by:" label when status is MATCHED
- ✅ Show `offer.recipientOrgName` value
- ✅ Hide action buttons for MATCHED status
- ✅ Show action buttons for other statuses (OPEN, FULFILLED, EXPIRED, CANCELLED)
- ✅ Proper spacing and alignment
- ✅ Color consistency with design system
- ✅ Responsive design (works on mobile)
- ✅ Fallback text if organization name is missing

---

## Code Location

**File**: `/app/donor/page.tsx`  
**Function**: `DonorPage()`  
**Section**: Active Surplus Offers table → Actions `<td>`  
**Lines**: 791-823

The conditional rendering:
```tsx
{offer.status === 'MATCHED' ? (
  // Show organization info
) : (
  // Show action buttons
)}
```

This ensures a clean, read-only state for matched offers while maintaining full functionality for active (OPEN) and completed (FULFILLED) offers.
