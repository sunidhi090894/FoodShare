# Quick Reference: Donor-Volunteer Integration Implementation

## 🎯 Feature Overview

Connects donors and volunteers based on their organization/volunteer city, enabling task assignment and completion tracking.

---

## 📋 Implementation Checklist

### Backend Implementation ✅
- [x] Add `donorCity` & `donorOrgName` fields to `surplus_offers` collection
- [x] Save organization city when surplus offer is created
- [x] Update donation approval to change status to `MATCHED`
- [x] Create volunteer assignment with donor city information
- [x] Filter volunteer assignments by city
- [x] Update volunteer assignment status on accept/reject/complete

### Frontend Implementation ✅
- [x] Display "Assigned to Me" tab with city-matched tasks
- [x] Add Accept/Reject buttons for unaccepted tasks
- [x] Display "Accepted Tasks" tab with accepted tasks
- [x] Show "Mark Delivered" button for accepted tasks
- [x] Display "Tasks Completed" section with all-time completions
- [x] Show completion metrics in summary cards
- [x] Update task counts dynamically

---

## 🚀 How It Works

### Step 1: Donor Creates & Approves
```
Donor → Create Surplus Offer
         ↓
         Save with: donorCity, donorOrgName
         ↓
         Recipient requests
         ↓
Donor → Approve Request
         ↓
         Change status to: MATCHED
         ↓
         Create volunteer assignment
```

### Step 2: Volunteer Gets Task
```
Volunteer logs in with city: "Mumbai"
         ↓
Query: GET /api/volunteer-assignments?volunteerCity=Mumbai
         ↓
Filter: donorCity == "Mumbai"
         ↓
Show in: "Assigned to Me" tab
```

### Step 3: Volunteer Accepts
```
Volunteer → Click "Accept Task"
         ↓
         PATCH status → "ACCEPTED"
         ↓
Task moves to: "Accepted Tasks"
         ↓
Button changes to: "Mark Delivered"
```

### Step 4: Volunteer Completes
```
Volunteer → Click "Mark Delivered"
         ↓
         PATCH status → "COMPLETED"
         ↓
Task moves to: "Tasks Completed"
         ↓
Counter increments: +1
```

---

## 📊 Data Structures

### Surplus Offer (in DB)
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId,
  status: "OPEN" | "MATCHED" | "FULFILLED" | "CANCELLED",
  items: [{ name, quantity, unit }],
  pickupWindowStart: Date,
  pickupWindowEnd: Date,
  pickupAddress: String,
  donorCity: String,              // ← NEW
  donorOrgName: String,           // ← NEW
  createdAt: Date
}
```

### Volunteer Assignment (in DB)
```javascript
{
  _id: ObjectId,
  surplusId: String,
  donorOrg: String,
  donorCity: String,              // ← Filters by this
  donorAddress: String,
  donorContact: String,
  items: String,
  pickupWindow: String,
  status: "ASSIGNED" | "ACCEPTED" | "COMPLETED" | "REJECTED",
  volunteerId: String | null,
  acceptedAt: Date | null,
  completedAt: Date | null,
  createdAt: Date
}
```

---

## 🔗 API Endpoints

### Get Assignments for City
```
GET /api/volunteer-assignments?volunteerCity=Mumbai

Response: [
  {
    _id: "...",
    surplusId: "...",
    donorOrg: "Food Bank X",
    donorCity: "Mumbai",
    items: "10 kg Rice",
    status: "ASSIGNED",
    ...
  }
]
```

### Create Assignment (Called by Donor Approval)
```
POST /api/volunteer-assignments
Body: {
  surplusId: "12345",
  donorOrg: "Food Bank X",
  donorCity: "Mumbai",
  donorAddress: "123 Main St",
  donorContact: "contact@foodbank.com",
  items: "10 kg Rice, 5 kg Dal",
  pickupWindow: "10 AM - 2 PM"
}

Response: {
  id: "...",
  status: "ASSIGNED",
  ...
}
```

### Update Assignment Status
```
PATCH /api/volunteer-assignments
Body: {
  assignmentId: "xyz",
  status: "ACCEPTED" | "COMPLETED" | "REJECTED",
  volunteerId: "vol123" // Optional, required for ACCEPTED
}

Response: { success: true, status: "ACCEPTED" }
```

---

## 🎨 UI Components

### Assigned to Me Tab
```
┌─────────────────────────────────┐
│ Assigned to Me                  │
│ Tasks waiting for your action   │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 10 kg Rice                  │ │
│ │ Food Bank X                 │ │
│ │ 123 Main St                 │ │
│ │ 10 AM - 2 PM                │ │
│ │                             │ │
│ │ [Accept] [Reject]           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Accepted Tasks Tab
```
┌─────────────────────────────────┐
│ Accepted Tasks                  │
│ Mark as delivered when done     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 10 kg Rice                  │ │
│ │ Food Bank X                 │ │
│ │ 123 Main St                 │ │
│ │ 10 AM - 2 PM                │ │
│ │                             │ │
│ │ [Mark Delivered]            │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Tasks Completed Section
```
┌─────────────────────────────────┐
│ Tasks Completed (42 all-time)   │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 10 kg Rice ✓                │ │
│ │ Food Bank X                 │ │
│ │ Completed: Nov 20, 11:30 AM │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 5 kg Vegetables ✓           │ │
│ │ Community Kitchen           │ │
│ │ Completed: Nov 19, 2:15 PM  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Summary Cards
```
┌──────────────────────┬──────────────────────┐
│ Tasks Accepted Today │ Tasks Completed      │
│        3             │        42            │
│ Tasks you accepted   │ All-time deliveries  │
└──────────────────────┴──────────────────────┘
```

---

## 🔄 State Management

### In Volunteer Dashboard
```typescript
// State hooks
const [assignments, setAssignments] = useState<Assignment[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

// Derived state
const assignedTasks = assignments.filter(a => a.status === 'ASSIGNED')
const acceptedTasks = assignments.filter(a => a.status === 'ACCEPTED')
const completedTasks = assignments.filter(a => a.status === 'COMPLETED')

// Metrics
const acceptedTasksToday = acceptedTasks.length
const completedTasksAll = completedTasks.length
```

---

## 🧪 Test Cases

### Test 1: City Filtering Works
```
Given: Donor in Mumbai creates offer
When: Volunteer in Delhi logs in
Then: Volunteer should NOT see the offer
     Volunteer in Mumbai SHOULD see the offer
```

### Test 2: Accept Workflow
```
Given: Task in "Assigned to Me"
When: Volunteer clicks "Accept Task"
Then: Task moves to "Accepted Tasks"
     Button changes to "Mark Delivered"
     acceptedAt timestamp is set
```

### Test 3: Completion Tracking
```
Given: Task in "Accepted Tasks"
When: Volunteer clicks "Mark Delivered"
Then: Task moves to "Tasks Completed"
     completedAt timestamp is set
     "Tasks Completed" counter increments
```

### Test 4: Rejection
```
Given: Task in "Assigned to Me"
When: Volunteer clicks "Reject"
Then: Task is removed from all tabs
     Status changes to "REJECTED"
```

---

## 🛠️ Files Modified

| File | Change | Lines |
|------|--------|-------|
| `lib/surplus-offers.ts` | Add city fields to schema | 3 new fields |
| `lib/surplus-offers.ts` | Save city in createSurplusOffer | 2 new assignments |
| `app/donor/page.tsx` | Update approval handler | Update status to MATCHED |
| `app/api/volunteer-assignments/route.ts` | Filter by donorCity | 1 condition change |
| `app/volunteer/page.tsx` | Add Accepted Tasks section | 30 lines |
| `app/volunteer/page.tsx` | Add Tasks Completed section | 35 lines |
| `app/volunteer/page.tsx` | Update renderTaskCard | Display improvements |

---

## 🚨 Important Notes

1. **City Matching**: Volunteer only sees tasks where `donorCity` equals volunteer's city (case-insensitive)

2. **Status Transitions**:
   - ASSIGNED → (Accept) → ACCEPTED
   - ACCEPTED → (Mark Delivered) → COMPLETED
   - ASSIGNED → (Reject) → Removed

3. **Timestamps**:
   - `acceptedAt`: Set when volunteer accepts
   - `completedAt`: Set when volunteer marks delivered

4. **Filtering**: GET endpoint filters by `volunteerCity` parameter only (no need for volunteerId)

---

## 📈 Metrics & Tracking

### Summary Cards
```
📊 Tasks Accepted Today = assignments.filter(a => a.status === 'ACCEPTED').length
📊 Tasks Completed = assignments.filter(a => a.status === 'COMPLETED').length
```

### Dashboard Tabs
```
Tab 1: Assigned to Me (status === 'ASSIGNED')
Tab 2: Accepted Tasks (status === 'ACCEPTED')
Tab 3: Tasks Completed (status === 'COMPLETED')
```

---

## 🎓 Usage Example

### For Developers

**Check if assignments load correctly:**
```typescript
const res = await fetch('/api/volunteer-assignments?volunteerCity=Mumbai')
const assignments = await res.json()
console.log(assignments) // Should show only Mumbai tasks
```

**Update assignment status:**
```typescript
const res = await fetch('/api/volunteer-assignments', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assignmentId: 'xyz123',
    status: 'ACCEPTED',
    volunteerId: 'vol456'
  })
})
```

---

## 🔗 Related Documentation

- `DONOR_VOLUNTEER_INTEGRATION.md` - Detailed feature documentation
- `IMPLEMENTATION_FLOW_DIAGRAM.md` - Visual workflow diagrams
- API Route: `/app/api/volunteer-assignments/route.ts`
- Frontend: `/app/volunteer/page.tsx`
- Schema: `/lib/surplus-offers.ts`

---

**Last Updated**: November 20, 2025
**Status**: ✅ Complete & Ready for Testing
