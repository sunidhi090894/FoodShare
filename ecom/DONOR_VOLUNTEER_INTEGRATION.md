# Donor-Volunteer Integration Feature

## Overview
This document describes the complete integration between the Donor Dashboard and Volunteer Dashboard, including organization city tracking, task assignment based on city matching, and task completion workflow.

## Features Implemented

### 1. **Store Donor Organization City in Database** ✅
**File**: `/lib/surplus-offers.ts`

When a surplus offer is created by a donor, the organization's city is automatically saved in the database:

```typescript
// New fields added to SurplusOfferDocument
donorCity?: string        // City of donor organization
donorOrgName?: string     // Name of donor organization
```

**Benefits**:
- Enables filtering of assignments based on geographic location
- Allows volunteers to see which organizations they're helping
- Facilitates better logistics planning

**Implementation Details**:
- When `createSurplusOffer()` is called, it automatically captures `organization.city` and `organization.name`
- These values are stored in the surplus_offers collection for future reference

---

### 2. **Donor Approval Triggers Status Change & Volunteer Assignment** ✅
**File**: `/app/donor/page.tsx`

When a donor approves a request:

1. ✅ Surplus offer status changes from `OPEN` to `MATCHED`
2. ✅ A volunteer assignment is created with city information
3. ✅ Assignment is sent to volunteers in the matching city

**Flow**:
```
Donor Views Request → Approves Request → Status: MATCHED
                                      ↓
                        Create Volunteer Assignment
                        with donorCity information
                                      ↓
                        Volunteers in that city see
                        the task in "Assigned to Me"
```

**Implementation**:
```typescript
// When request is approved:
1. Update surplus offer status to MATCHED
2. Create volunteer assignment with:
   - surplusId
   - donorOrg (organization name)
   - donorCity (organization city)
   - donorAddress
   - donorContact
   - items
   - pickupWindow
   - status: 'ASSIGNED'
```

---

### 3. **City-Based Task Filtering for Volunteers** ✅
**File**: `/app/api/volunteer-assignments/route.ts`

Volunteer dashboard only shows tasks from donors in their city:

```typescript
// GET endpoint filters by volunteer's city
const result = await assignments.find({
  donorCity: volunteerCity,  // Match volunteer's city
  $or: [
    { status: 'ASSIGNED' },
    { status: 'ACCEPTED' },
    { status: 'COMPLETED' }
  ]
}).toArray()
```

**Benefits**:
- Volunteers only see relevant tasks in their location
- Reduces noise and improves task acceptance rates
- Facilitates local logistics

---

### 4. **Volunteer Task Acceptance Workflow** ✅
**File**: `/app/volunteer/page.tsx`

#### "Assigned to Me" Tab
Displays all tasks assigned to the volunteer's city:
- **Status**: ASSIGNED
- **Buttons**:
  - ✅ **Accept Task** - Accepts the task and moves it to "Accepted Tasks"
  - ❌ **Reject** - Rejects the task and removes it

When Accept is clicked:
```typescript
// Status changes from ASSIGNED to ACCEPTED
{
  status: 'ACCEPTED',
  acceptedAt: new Date(),
  volunteerId: currentVolunteerId
}
```

---

### 5. **Accepted Tasks & Mark Delivered** ✅
**File**: `/app/volunteer/page.tsx`

#### "Accepted Tasks" Tab
Shows all tasks the volunteer has accepted:
- **Status**: ACCEPTED
- **Button**: **Mark Delivered** - Completes the task

#### Task Completion Flow:
```
Volunteer Accepts Task
        ↓
Task appears in "Accepted Tasks" tab
        ↓
Volunteer clicks "Mark Delivered"
        ↓
Status changes to COMPLETED
        ↓
Task moves to "Tasks Completed" section
        ↓
All-time completion counter increments
```

---

### 6. **Tasks Completed Tracking** ✅
**File**: `/app/volunteer/page.tsx`

#### "Tasks Completed" Tab
Shows all tasks completed by the volunteer (all-time):

**Metrics**:
- **Total count**: All-time task completions
- **Info shown per task**:
  - Surplus ID
  - Items details
  - Donor organization name
  - Completion timestamp
  - Status: COMPLETED (green badge)

---

## Database Schema Changes

### Surplus Offers Collection
```typescript
{
  _id: ObjectId,
  organizationId: ObjectId,
  createdByUserId: ObjectId,
  items: SurplusItem[],
  pickupWindowStart: Date,
  pickupWindowEnd: Date,
  pickupAddress: string,
  donorCity: string,           // NEW: Organization city
  donorOrgName: string,        // NEW: Organization name
  status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED',
  createdAt: Date,
  updatedAt: Date
}
```

### Volunteer Assignments Collection
```typescript
{
  _id: ObjectId,
  surplusId: string,
  donorOrg: string,
  donorCity: string,           // Used for filtering by volunteer's city
  donorAddress: string,
  donorContact: string,
  items: string,
  pickupWindow: string,
  status: 'ASSIGNED' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED',
  volunteerId: string | null,
  acceptedAt: Date | null,
  completedAt: Date | null,
  createdAt: Date
}
```

---

## API Endpoints

### GET `/api/volunteer-assignments`
**Parameters**:
- `volunteerCity` - The city of the volunteer

**Response**: Array of assignments where `donorCity` matches `volunteerCity`

**Status Filtering**: Only returns assignments with status:
- ASSIGNED
- ACCEPTED
- COMPLETED

---

### POST `/api/volunteer-assignments`
**Body**:
```json
{
  "surplusId": "string",
  "donorOrg": "string",
  "donorCity": "string",
  "donorAddress": "string",
  "donorContact": "string",
  "items": "string",
  "pickupWindow": "string"
}
```

**Creates**: New assignment with `status: 'ASSIGNED'`

---

### PATCH `/api/volunteer-assignments`
**Body**:
```json
{
  "assignmentId": "string",
  "status": "ACCEPTED" | "COMPLETED" | "REJECTED",
  "volunteerId": "string" (optional, required for ACCEPTED status)
}
```

**Updates**: Assignment status and timestamps
- **ACCEPTED**: Sets `acceptedAt` timestamp and `volunteerId`
- **COMPLETED**: Sets `completedAt` timestamp
- **REJECTED**: No additional fields

---

## User Flow Diagram

### Donor Side:
```
Donor creates Surplus Offer
    ↓
Shows in "Active Surplus Offers" with status OPEN
    ↓
Recipients request the offer
    ↓
Donor approves request
    ↓
Status changes to MATCHED
    ↓
Volunteer Assignment created with donorCity
```

### Volunteer Side:
```
Volunteer logs in with city (e.g., Mumbai)
    ↓
Dashboard fetches assignments where donorCity = "Mumbai"
    ↓
Shows in "Assigned to Me" tab
    ↓
Volunteer sees:
  - Donor organization name & address
  - Items details
  - Pickup window
  - Donor contact
    ↓
Volunteer clicks "Accept Task"
    ↓
Task moves to "Accepted Tasks" tab
    ↓
Button changes to "Mark Delivered"
    ↓
Volunteer clicks "Mark Delivered"
    ↓
Task moves to "Tasks Completed" section
    ↓
All-time counter increments
```

---

## Key Features

| Feature | Donor | Volunteer | Status |
|---------|-------|-----------|--------|
| Save organization city | ✅ Auto-saved | ✅ Used for filtering | Complete |
| Approve requests | ✅ View & approve | - | Complete |
| Status change to MATCHED | ✅ Automatic | ✅ Triggers assignment | Complete |
| City-based filtering | - | ✅ Only shows own city | Complete |
| Accept/Reject tasks | - | ✅ Accept button | Complete |
| Mark delivered | - | ✅ Mark Delivered button | Complete |
| Track completions | - | ✅ Tasks Completed tab | Complete |

---

## Testing Checklist

### Donor Dashboard
- [ ] Create organization with city
- [ ] Create surplus offer (verify city is saved)
- [ ] View incoming requests
- [ ] Approve a request
- [ ] Verify offer status changes to MATCHED
- [ ] Check volunteer assignment was created

### Volunteer Dashboard
- [ ] Update profile with city
- [ ] Refresh assignments
- [ ] Verify only assignments from same city show
- [ ] Accept a task from "Assigned to Me"
- [ ] Verify task appears in "Accepted Tasks"
- [ ] Click "Mark Delivered"
- [ ] Verify task appears in "Tasks Completed"
- [ ] Verify completion count increments

---

## Future Enhancements

1. **Distance-Based Filtering**: Use geolocation instead of just city
2. **Volunteer Ratings**: Track volunteer performance metrics
3. **Task Notifications**: Real-time notifications for new tasks
4. **Analytics Dashboard**: Volunteer impact tracking
5. **Task Reassignment**: Auto-reassign if volunteer rejects
6. **Delivery Proof**: Photo/signature on completion

---

## Files Modified

1. **`/lib/surplus-offers.ts`**
   - Added `donorCity` and `donorOrgName` fields
   - Updated `createSurplusOffer()` to save city data

2. **`/app/donor/page.tsx`**
   - Updated `handleApproveRequest()` to change status to MATCHED
   - Ensured volunteer assignment includes donorCity

3. **`/app/api/volunteer-assignments/route.ts`**
   - Updated GET to filter by `donorCity` instead of `volunteerCity`
   - Ensured assignments store all necessary fields

4. **`/app/volunteer/page.tsx`**
   - Added success message on accept
   - Added "Tasks Completed" section
   - Improved task card display
   - Enhanced button logic for different statuses

---

## Configuration

No additional configuration needed. The feature uses existing environment variables:
- `MONGODB_URI` - Database connection
- `NEXT_PUBLIC_*` - Client-side config (if needed)

---

## Support & Questions

For issues or questions about this integration, refer to the implementation files and API documentation above.
