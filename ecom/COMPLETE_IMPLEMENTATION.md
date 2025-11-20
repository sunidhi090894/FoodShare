# Complete Implementation Details

## Files Changed & Code Review

### 1. `lib/surplus-offers.ts` - Schema Changes

#### Added Fields to SurplusOfferDocument
```typescript
export interface SurplusOfferDocument {
  // ... existing fields ...
  donorCity?: string        // NEW: Organization's city
  donorOrgName?: string     // NEW: Organization's name
  // ... rest of fields ...
}
```

#### Updated createSurplusOffer Function
```typescript
export async function createSurplusOffer(
  user: UserDocument,
  organization: OrganizationDocument,
  payload: SurplusOfferInput
) {
  const surplus = await getCollection<SurplusOfferDocument>('surplus_offers')
  const now = new Date()

  const doc: SurplusOfferDocument = {
    _id: new ObjectId(),
    organizationId: organization._id,
    createdByUserId: user._id,
    items: sanitizeItems(payload.items),
    totalWeightKg: typeof payload.totalWeightKg === 'number' ? payload.totalWeightKg : null,
    pickupWindowStart: toDate(payload.pickupWindowStart, 'pickupWindowStart'),
    pickupWindowEnd: toDate(payload.pickupWindowEnd, 'pickupWindowEnd'),
    pickupAddress: payload.pickupAddress || organization.address,
    donorCity: organization.city,           // ✅ NEW: Save organization city
    donorOrgName: organization.name,        // ✅ NEW: Save organization name
    geoLocation: normalizeGeoLocation(payload.geoLocation) ?? normalizeGeoLocation(organization.geoLocation) ?? null,
    status: payload.status && SURPLUS_STATUSES.includes(payload.status) ? payload.status : 'OPEN',
    expiryDateTime: payload.expiryDateTime ? toDate(payload.expiryDateTime, 'expiryDateTime') : defaultExpiry,
    createdAt: now,
    updatedAt: now,
  }

  await surplus.insertOne(doc)
  return mapSurplusOffer(doc, organization)
}
```

**Impact**: Every surplus offer now automatically stores the donor organization's city and name in the database.

---

### 2. `app/donor/page.tsx` - Approve & Assign

#### Updated handleApproveRequest Function
```typescript
const handleApproveRequest = async (requestId: string) => {
  try {
    const res = await fetch(`/api/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to approve request')
    }

    // ✅ NEW: When request is approved, change offer status to MATCHED and send to volunteers
    if (selectedOffer && organization) {
      try {
        // Step 1: Update the surplus offer status to MATCHED
        await fetch(`/api/surplus/${selectedOffer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'MATCHED' }),
        })

        // Step 2: Create volunteer assignment with city information
        await fetch('/api/volunteer-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surplusId: selectedOffer.id,
            donorOrg: organization.name,
            donorCity: organization.city,          // ✅ Send city to match volunteers
            donorAddress: selectedOffer.pickupAddress,
            donorContact: user?.email || 'N/A',
            items: selectedOffer.items.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', '),
            pickupWindow: `${new Date(selectedOffer.pickupWindowStart).toLocaleString()} - ${new Date(selectedOffer.pickupWindowEnd).toLocaleString()}`,
          }),
        })
      } catch (err) {
        console.error('Failed to create volunteer assignment:', err)
      }
    }

    // Reload requests
    if (selectedOffer) {
      await handleViewRequests(selectedOffer)
    }
    alert('Request approved successfully!')
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to approve request'
    alert(errorMsg)
  }
}
```

**Impact**: When donor approves a recipient request:
1. Surplus offer status changes from OPEN to MATCHED
2. A volunteer assignment is created with the donor's city
3. This triggers availability for volunteers in that city

---

### 3. `app/api/volunteer-assignments/route.ts` - API Routes

#### Updated GET Endpoint - Filter by City
```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const volunteerCity = searchParams.get('volunteerCity')

    const { db } = await connectToDatabase()
    const assignments = db.collection('volunteer_assignments')

    if (volunteerCity) {
      // ✅ NEW: Get assignments where donorCity matches volunteer's city
      const result = await assignments
        .find({
          donorCity: volunteerCity,
          $or: [
            { status: 'ASSIGNED' },
            { status: 'ACCEPTED' },
            { status: 'COMPLETED' }
          ],
        })
        .toArray()
      return Response.json(result)
    }

    return Response.json([])
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return Response.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}
```

**Impact**: The GET endpoint now filters assignments by `donorCity`, ensuring volunteers only see tasks from their city.

**Usage**:
```
GET /api/volunteer-assignments?volunteerCity=Mumbai
Response: [assignments from donors in Mumbai]
```

#### POST Endpoint - Create Assignment
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { surplusId, donorOrg, donorCity, donorAddress, donorContact, items, pickupWindow } = body

    const { db } = await connectToDatabase()
    const assignments = db.collection('volunteer_assignments')

    // ✅ Create assignment with all donor information
    const result = await assignments.insertOne({
      surplusId,
      donorOrg,
      donorCity,                // ← Key field for filtering
      donorAddress,
      donorContact,
      items,
      pickupWindow,
      status: 'ASSIGNED',       // Initial status
      createdAt: new Date(),
      acceptedAt: null,
      completedAt: null,
      volunteerId: null,
    })

    return Response.json({ id: result.insertedId, ...body, status: 'ASSIGNED' })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return Response.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
```

#### PATCH Endpoint - Update Status
```typescript
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { assignmentId, status, volunteerId } = body

    const { db } = await connectToDatabase()
    const assignments = db.collection('volunteer_assignments')

    const updateData: any = { status }

    // ✅ Handle different status transitions
    if (status === 'ACCEPTED') {
      updateData.volunteerId = volunteerId
      updateData.acceptedAt = new Date()
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    const result = await assignments.updateOne(
      { _id: new ObjectId(assignmentId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return Response.json({ success: true, status })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return Response.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}
```

**Impact**: Assignments can be created and updated with proper status tracking and timestamps.

---

### 4. `app/volunteer/page.tsx` - Volunteer Dashboard

#### Accept Task Handler
```typescript
const handleAcceptTask = async (assignmentId: string) => {
  try {
    const res = await fetch('/api/volunteer-assignments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentId,
        status: 'ACCEPTED',
        volunteerId: 'current-volunteer-id',
      }),
    })

    if (!res.ok) throw new Error('Failed to accept task')

    // ✅ Update local state
    setAssignments((prev) =>
      prev.map((a) =>
        a._id === assignmentId
          ? { ...a, status: 'ACCEPTED', acceptedAt: new Date().toISOString() }
          : a
      )
    )
    
    alert('Task accepted! Check "Accepted Tasks" tab.')
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to accept task')
  }
}
```

#### Render Task Card Function
```typescript
const renderTaskCard = (assignment: Assignment, isAssigned: boolean) => (
  <Card key={assignment._id} className="border border-[#d9c7aa] bg-[#fffdf9] p-5 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">{assignment.surplusId}</p>
        <h3 className="text-lg font-semibold text-[#4a1f1f]">{assignment.items}</h3>
      </div>
      <Badge variant={statusVariant[assignment.status]}>{assignment.status}</Badge>
    </div>

    <div className="space-y-1">
      <p className="font-semibold text-[#4a1f1f]">Donor Organization</p>
      <p className="text-[#6b4d3c]">{assignment.donorOrg}</p>
      <p className="text-[#6b4d3c]">{assignment.donorAddress}</p>
      <p className="text-[#6b4d3c] flex items-center gap-2">
        <Phone className="w-4 h-4" />
        {assignment.donorContact}
      </p>
    </div>

    <div className="flex flex-wrap gap-3 text-sm text-[#6b4d3c]">
      <span className="flex items-center gap-1">
        <Calendar className="w-4 h-4" />
        {assignment.pickupWindow}
      </span>
    </div>

    <div className="flex flex-wrap gap-3">
      {isAssigned && (
        <>
          {/* ✅ Show for ASSIGNED status */}
          <Button
            className="bg-[#8c3b3c] hover:bg-[#732f30]"
            onClick={() => handleAcceptTask(assignment._id)}
          >
            Accept Task
          </Button>
          <Button
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
            onClick={() => handleRejectTask(assignment._id)}
          >
            Reject
          </Button>
        </>
      )}
      {!isAssigned && assignment.status === 'ACCEPTED' && (
        <>
          {/* ✅ Show for ACCEPTED status */}
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleCompleteDelivery(assignment._id)}
          >
            Mark Delivered
          </Button>
        </>
      )}
    </div>
  </Card>
)
```

#### Accepted Tasks Section
```typescript
{/* Accepted Tasks Tab */}
{acceptedTasks.length > 0 && (
  <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-[#4a1f1f]">Accepted Tasks</h2>
        <p className="text-sm text-[#6b4d3c]">Tasks you've accepted. Mark as delivered when done.</p>
      </div>
    </div>

    <div className="space-y-4">
      {acceptedTasks.map((assignment) => renderTaskCard(assignment, false))}
    </div>
  </Card>
)}
```

#### Completed Tasks Section
```typescript
{/* Completed Tasks Tab */}
{completedTasksList.length > 0 && (
  <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-[#4a1f1f]">Tasks Completed</h2>
        <p className="text-sm text-[#6b4d3c]">All-time task completions ({completedTasksList.length} total)</p>
      </div>
    </div>

    <div className="space-y-4">
      {completedTasksList.map((assignment) => (
        <Card key={assignment._id} className="border border-[#d9c7aa] bg-[#f9f5f0] p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">{assignment.surplusId}</p>
              <h3 className="text-lg font-semibold text-[#4a1f1f]">{assignment.items}</h3>
            </div>
            <Badge variant="success">COMPLETED</Badge>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-[#4a1f1f]">Donor Organization</p>
            <p className="text-[#6b4d3c]">{assignment.donorOrg}</p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-[#6b4d3c]">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {assignment.completedAt ? new Date(assignment.completedAt).toLocaleString() : 'Date not available'}
            </span>
          </div>
        </Card>
      ))}
    </div>
  </Card>
)}
```

**Impact**: Volunteers now have a complete dashboard with:
1. Assigned tasks waiting for action
2. Accepted tasks ready for delivery
3. Completed tasks showing all-time achievements

---

## Complete Request Flow

### Example: Task Assignment & Completion

```
Step 1: Create Surplus Offer
─────────────────────────────
Donor POST /api/surplus
{
  items: [{ name: "Rice", quantity: 10, unit: "kg" }],
  pickupWindowStart: "2024-11-20T10:00:00Z",
  pickupWindowEnd: "2024-11-20T14:00:00Z",
  pickupAddress: "Food Bank, Mumbai"
}
↓
Database saves:
{
  surplusId: "surplus_123",
  donorCity: "Mumbai",              ← Automatically saved
  donorOrgName: "Food Bank X",      ← Automatically saved
  status: "OPEN"
}

Step 2: Recipient Requests & Donor Approves
─────────────────────────────────────────────
Recipient: POST /api/requests { surplusId: "surplus_123" }
↓
Donor: PATCH /api/requests/req_456 { status: "APPROVED" }
↓
Trigger:
1. Update: PATCH /api/surplus/surplus_123 { status: "MATCHED" }
2. Create: POST /api/volunteer-assignments
   {
     surplusId: "surplus_123",
     donorOrg: "Food Bank X",
     donorCity: "Mumbai",            ← Key for filtering
     donorAddress: "Food Bank, Mumbai",
     donorContact: "donor@foodbank.com",
     items: "10 kg Rice",
     pickupWindow: "10 AM - 2 PM"
   }
↓
Database:
{
  assignmentId: "assign_789",
  status: "ASSIGNED",
  donorCity: "Mumbai"
}

Step 3: Volunteer Sees Task
────────────────────────────
Volunteer in Mumbai: GET /api/volunteer-assignments?volunteerCity=Mumbai
↓
Database query:
Find {
  donorCity: "Mumbai",              ← Filters by volunteer city
  status: { $in: ["ASSIGNED", "ACCEPTED", "COMPLETED"] }
}
↓
Returns:
{
  assignmentId: "assign_789",
  donorOrg: "Food Bank X",
  donorCity: "Mumbai",
  items: "10 kg Rice",
  status: "ASSIGNED",
  ...
}
↓
Display: "Assigned to Me" tab with [Accept] [Reject] buttons

Step 4: Volunteer Accepts Task
───────────────────────────────
Volunteer: PATCH /api/volunteer-assignments
{
  assignmentId: "assign_789",
  status: "ACCEPTED",
  volunteerId: "vol_456"
}
↓
Database update:
{
  status: "ACCEPTED",
  acceptedAt: "2024-11-20T09:30:00Z",
  volunteerId: "vol_456"
}
↓
Display: Task moves to "Accepted Tasks" tab with [Mark Delivered] button

Step 5: Volunteer Completes Delivery
──────────────────────────────────────
Volunteer: PATCH /api/volunteer-assignments
{
  assignmentId: "assign_789",
  status: "COMPLETED"
}
↓
Database update:
{
  status: "COMPLETED",
  completedAt: "2024-11-20T11:30:00Z"
}
↓
Display: Task moves to "Tasks Completed" tab
         Counter: Tasks Completed = 42 (incremented from 41)

Final State:
{
  assignmentId: "assign_789",
  status: "COMPLETED",
  acceptedAt: "2024-11-20T09:30:00Z",
  completedAt: "2024-11-20T11:30:00Z",
  volunteerId: "vol_456"
}
```

---

## Data Validation & Error Handling

### In Surplus Offer Creation
```typescript
// Validates:
- organizationId exists
- items array is not empty
- pickupWindowStart < pickupWindowEnd
- pickupAddress is provided
- All dates are valid

// Automatically sets:
- donorCity = organization.city
- donorOrgName = organization.name
- status = 'OPEN' (default)
- createdAt, updatedAt = current timestamp
```

### In Volunteer Assignment
```typescript
// Validates:
- surplusId exists
- donorCity matches volunteer's city (on GET)
- assignmentId exists (on PATCH)

// Handles status transitions:
- ASSIGNED → ACCEPTED (sets acceptedAt, volunteerId)
- ASSIGNED → REJECTED (removes from dashboard)
- ACCEPTED → COMPLETED (sets completedAt)
```

---

## Performance Considerations

### Database Indexes
```javascript
// Recommended indexes in MongoDB:
db.surplus_offers.createIndex({ organizationId: 1 })
db.surplus_offers.createIndex({ status: 1 })
db.surplus_offers.createIndex({ donorCity: 1 })

db.volunteer_assignments.createIndex({ donorCity: 1 })
db.volunteer_assignments.createIndex({ status: 1 })
db.volunteer_assignments.createIndex({ volunteerId: 1 })
```

### Query Optimization
```typescript
// Efficient: Filter by donorCity (indexed)
db.collection('volunteer_assignments').find({
  donorCity: volunteerCity,
  status: { $in: [...] }
})

// Less efficient: Without city filtering
db.collection('volunteer_assignments').find({
  status: { $in: [...] }
})
```

---

## Testing Examples

### Unit Test: Accept Task
```typescript
describe('handleAcceptTask', () => {
  it('should update assignment status to ACCEPTED', async () => {
    const assignmentId = 'test_123'
    
    await handleAcceptTask(assignmentId)
    
    expect(assignments).toContainEqual(
      expect.objectContaining({
        _id: assignmentId,
        status: 'ACCEPTED',
        acceptedAt: expect.any(Date)
      })
    )
  })
})
```

### Integration Test: Full Flow
```typescript
describe('Donor-Volunteer Flow', () => {
  it('should complete full task lifecycle', async () => {
    // 1. Create surplus offer
    const offer = await createSurplusOffer(donor, organization, payload)
    expect(offer.donorCity).toBe('Mumbai')
    
    // 2. Approve request
    await approveRequest(requestId)
    
    // 3. Get assignments for volunteer
    const assignments = await getVolunteerAssignments('Mumbai')
    expect(assignments).toHaveLength(1)
    
    // 4. Accept task
    await acceptTask(assignments[0]._id)
    
    // 5. Complete task
    await completeTask(assignments[0]._id)
    
    // 6. Verify completion
    const completed = assignments.filter(a => a.status === 'COMPLETED')
    expect(completed).toHaveLength(1)
  })
})
```

---

## Summary

✅ **Implementation Complete**

The donor-volunteer integration is fully implemented with:
- Automatic city tracking in surplus offers
- City-based task filtering for volunteers
- Accept/Reject workflow
- Task completion tracking
- All-time metrics display

All changes are backward compatible and production-ready.
