# Volunteer Assignment System - Integration Complete

## Overview
The system now connects donor surplus offers with volunteer assignments based on city matching.

## Workflow

### 1. **Donor Dashboard → Volunteer Assignment Creation**
When a donor approves a surplus request:
- The matched offer details are sent to `/api/volunteer-assignments` endpoint
- Data includes: donor org, city, address, contact, items, and pickup window
- Assignment is created with status `ASSIGNED`

### 2. **Volunteer Dashboard → Task Display**
The volunteer dashboard:
- Fetches assignments from `/api/volunteer-assignments?volunteerCity=<city>`
- Only shows assignments where donor city matches volunteer's city
- Displays tasks in "Assigned to Me" tab

### 3. **Volunteer Task Acceptance**
When volunteer clicks "Accept Task":
- Status changes from `ASSIGNED` → `ACCEPTED`
- Volunteer ID is recorded
- Task moves to "Accepted Tasks" tab
- "Tasks Accepted Today" counter increments

### 4. **Delivery Completion**
When volunteer clicks "Mark Delivered":
- Status changes from `ACCEPTED` → `COMPLETED`
- Completion timestamp recorded
- Task removed from active tabs
- "Tasks Completed" counter increments (all-time)

### 5. **Task Rejection**
Volunteers can reject ASSIGNED tasks:
- Status changes to `REJECTED`
- Task is removed from display
- Task becomes available for other volunteers

## API Endpoints

### GET `/api/volunteer-assignments`
Fetches assignments for a volunteer filtered by city
```
Query Parameters:
- volunteerCity: string (required)
- volunteerId: string (optional)
```

### POST `/api/volunteer-assignments`
Creates a new assignment from a matched offer
```
Body:
{
  surplusId: string
  donorOrg: string
  donorCity: string
  donorAddress: string
  donorContact: string
  items: string
  pickupWindow: string
}
```

### PATCH `/api/volunteer-assignments`
Updates assignment status
```
Body:
{
  assignmentId: string
  status: 'ACCEPTED' | 'COMPLETED' | 'REJECTED'
  volunteerId?: string (required for ACCEPTED)
}
```

## Data Flow

```
Donor Approves Request
        ↓
Creates Assignment in volunteer_assignments collection
        ↓
Volunteer Dashboard fetches assignments (city-filtered)
        ↓
Volunteer sees "Assigned to Me" tab
        ↓
Volunteer clicks "Accept Task"
        ↓
Assignment status → ACCEPTED
        ↓
Task moves to "Accepted Tasks" tab
        ↓
Volunteer clicks "Mark Delivered"
        ↓
Assignment status → COMPLETED
        ↓
Task removed from active tabs
        ↓
"Tasks Completed" count increments
```

## Key Features

✅ **City-Based Matching**: Only assignments matching volunteer's city are shown
✅ **Real-Time Counters**: 
  - Tasks Accepted Today: counts ACCEPTED status
  - Tasks Completed: counts COMPLETED status (all-time)
✅ **Complete Workflow**: Accept → Work → Complete
✅ **Volunteer Profile**: Name, City, Vehicle Type, Age for better matching
✅ **Request/Reject Option**: Volunteers can reject unsuitable tasks

## Database Collection: volunteer_assignments

```typescript
{
  _id: ObjectId
  surplusId: string
  donorOrg: string
  donorCity: string
  donorAddress: string
  donorContact: string
  items: string
  pickupWindow: string
  status: 'ASSIGNED' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED'
  volunteerId?: string
  acceptedAt?: Date
  completedAt?: Date
  createdAt: Date
}
```

## Testing the Flow

1. **Donor Dashboard**:
   - Create surplus offer with items and pickup window
   - Mark status as MATCHED when accepting recipient request

2. **Check MongoDB**: 
   - Assignment should appear in `volunteer_assignments` collection

3. **Volunteer Dashboard**:
   - Update city in profile to match donor city
   - Refresh to see assignments
   - Click "Accept Task"
   - See "Tasks Accepted Today" increment
   - Click "Mark Delivered"
   - See "Tasks Completed" increment
