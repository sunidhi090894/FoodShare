# Volunteer Assignment System - Visual Workflow

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      DONOR DASHBOARD                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Organization Profile Setup                                   │
│     ├─ Name: "Spice Route Café"                                  │
│     ├─ Address: "Bandra West, 4th Road"                          │
│     └─ CITY: "Mumbai" ← SAVED IN DATABASE                        │
│                                                                   │
│  2. Create Surplus Offer                                         │
│     ├─ Items: "Biryani trays (30 plates)"                        │
│     ├─ Pickup Window: Today 2:00 - 4:00 PM                       │
│     └─ Address: "Bandra West · 4th Road"                         │
│                                                                   │
│  3. Recipient Requests Offer                                     │
│                                                                   │
│  4. Donor Approves Request ← TRIGGER POINT                       │
│     │                                                             │
│     └─→ API Call: POST /api/volunteer-assignments                │
│           {                                                       │
│             surplusId: "SURPLUS-123",                             │
│             donorOrg: "Spice Route Café",                         │
│             donorCity: "Mumbai" ← FROM ORGANIZATION              │
│             donorAddress: "Bandra West · 4th Road",              │
│             donorContact: "cafe@example.com",                    │
│             items: "Biryani trays (30 plates)",                  │
│             pickupWindow: "11/20/2025, 2:00 PM - 4:00 PM"        │
│           }                                                       │
│                                                                   │
│  5. Assignment Created in Database                               │
│     ├─ status: "ASSIGNED"                                        │
│     ├─ donorCity: "Mumbai"                                       │
│     └─ volunteerId: null (not yet assigned)                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                   [MONGODB DATABASE]
                  volunteer_assignments
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    VOLUNTEER DASHBOARD                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Volunteer Profile                                            │
│     ├─ Name: "Anita Sharma"                                      │
│     ├─ CITY: "Mumbai" ← FILTER KEY                               │
│     ├─ Vehicle: "Two-wheeler"                                    │
│     └─ Age: "28"                                                 │
│                                                                   │
│  2. Fetch Assignments                                            │
│     GET /api/volunteer-assignments?volunteerCity=Mumbai          │
│     ↓                                                             │
│     Filter: donorCity === volunteerCity                          │
│     ✓ Assignment MATCHES (Mumbai === Mumbai)                     │
│                                                                   │
│  3. Display in "Assigned to Me" Tab                              │
│     ┌─────────────────────────────────────────┐                  │
│     │ TASK-123: Biryani trays (30 plates)     │                  │
│     │                                          │                  │
│     │ Donor: Spice Route Café                  │                  │
│     │ Address: Bandra West · 4th Road          │                  │
│     │ Pickup: Today 2:00 - 4:00 PM             │                  │
│     │ Status: ASSIGNED                         │                  │
│     │                                          │                  │
│     │ [Accept Task] [Reject]                   │                  │
│     └─────────────────────────────────────────┘                  │
│                                                                   │
│  4. Volunteer Clicks "Accept Task"                               │
│     │                                                             │
│     └─→ PATCH /api/volunteer-assignments                         │
│           {                                                       │
│             assignmentId: "...",                                  │
│             status: "ACCEPTED",                                  │
│             volunteerId: "volunteer-456"                         │
│           }                                                       │
│           ↓                                                       │
│     Status Changes: ASSIGNED → ACCEPTED                          │
│     acceptedAt: <timestamp>                                      │
│     Tasks Accepted Today: 1 ← INCREMENTS                         │
│                                                                   │
│  5. Button Changes to "Mark Delivered"                           │
│     Task Moves to "Accepted Tasks" Tab                           │
│                                                                   │
│  6. Volunteer Does the Delivery                                  │
│     (In real world)                                              │
│                                                                   │
│  7. Volunteer Clicks "Mark Delivered"                            │
│     │                                                             │
│     └─→ PATCH /api/volunteer-assignments                         │
│           {                                                       │
│             assignmentId: "...",                                  │
│             status: "COMPLETED"                                  │
│           }                                                       │
│           ↓                                                       │
│     Status Changes: ACCEPTED → COMPLETED                         │
│     completedAt: <timestamp>                                     │
│     Tasks Completed: 1 ← INCREMENTS (PERMANENT)                  │
│                                                                   │
│  8. Task Removed from Active Tabs                                │
│     Summary:                                                     │
│     • Tasks Accepted Today: 1                                    │
│     • Tasks Completed: 1                                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## State Transitions Diagram

```
┌──────────────┐
│   ASSIGNED   │
│ (Initial)    │
└──────┬───────┘
       │
       │ Volunteer accepts task
       ↓
┌──────────────┐          ┌──────────────┐
│   ACCEPTED   │ ← ─ ─ ─ ┤   REJECTED   │
│              │          │ (Volunteer   │
│              │          │  rejects)    │
└──────┬───────┘          └──────────────┘
       │
       │ Volunteer marks delivered
       ↓
┌──────────────┐
│  COMPLETED   │
│ (Final)      │
└──────────────┘
```

## Counter Increment Logic

```
TASKS ACCEPTED TODAY:
├─ Counts assignments with status = 'ACCEPTED'
├─ Recalculated on each fetch
└─ Example:
   - Initial: 0
   - Volunteer 1 accepts: 1
   - Volunteer 2 accepts: 2
   - Volunteer 1 completes: still 2 (only counts ACCEPTED status)

TASKS COMPLETED:
├─ Counts assignments with status = 'COMPLETED'
├─ NEVER DECREMENTS (all-time record)
├─ Includes completions from previous dates
└─ Example:
   - Day 1: Volunteer completes 3 tasks → Tasks Completed: 3
   - Day 2: Volunteer completes 2 more tasks → Tasks Completed: 5
   - This counter keeps growing forever
```

## City Matching Logic

```
Donor Organization Data:
{
  name: "Spice Route Café",
  city: "Mumbai"  ← Extracted and sent with assignment
}

Volunteer Profile:
{
  name: "Anita Sharma",
  city: "Mumbai"  ← Used to filter assignments
}

Assignment Query:
GET /api/volunteer-assignments?volunteerCity=Mumbai

Database Filter:
db.volunteer_assignments.find({
  volunteerCity: "Mumbai",  ← Matches volunteer's city
  status: { $in: ['ASSIGNED', 'ACCEPTED', 'COMPLETED'] }
})

Result: ✓ MATCH - Assignment shown to volunteer
```

## Important Notes

1. **Organization City is the Source of Truth**
   - Stored when organization is created
   - Used when assignment is created
   - Never changes unless organization is edited

2. **Volunteer City is the Filter**
   - Used to fetch only relevant assignments
   - Must match donor's organization city
   - Can be edited in volunteer profile anytime

3. **Counters are Calculated, Not Stored**
   - Tasks Accepted Today = count(status=ACCEPTED)
   - Tasks Completed = count(status=COMPLETED)
   - Both recalculated each time assignments are fetched

4. **All-Time Completion Tracking**
   - Tasks Completed counter never resets
   - Includes all historical completions
   - Provides volunteer's career achievement count
