# Quick Testing Guide - Volunteer Assignment System

## Step-by-Step Testing Instructions

### Phase 1: Setup Organization (Donor)

1. **Log in to Donor Dashboard**
   - Navigate to `/donor`
   - Current user: Test donor account

2. **Create or Update Organization**
   - If no organization exists:
     - Click "Set Up Organization" button
     - Fill in:
       - Name: "Test Café"
       - Address: "123 Main Street"
       - City: "Mumbai" ← **IMPORTANT: Must set city**
     - Click "Create Organization"
   - If organization exists:
     - Organization city should already be stored in database

3. **Verify Organization in Database**
   ```javascript
   // In MongoDB, check organizations collection:
   db.organizations.findOne({ name: "Test Café" })
   // Should show: { ..., city: "Mumbai", ... }
   ```

---

### Phase 2: Create Surplus Offer (Donor)

1. **Create Surplus Offer**
   - Click "Create Surplus Offer"
   - Fill in:
     - Item Name: "Biryani Trays"
     - Quantity: 30
     - Unit: plates
     - Pickup Window: Today 2:00 PM - 4:00 PM
   - Click "Create Offer"

2. **Verify Offer Created**
   - Should appear in "Active Surplus Offers" table
   - Status should be "OPEN"

---

### Phase 3: Recipient Request (Different User)

1. **Switch to Recipient Account**
   - Log in as recipient user
   - Navigate to recipient dashboard

2. **Request the Surplus Offer**
   - Browse available offers
   - Find "Biryani Trays" from "Test Café"
   - Click "Request"
   - Confirm request

---

### Phase 4: Approve Request → Create Assignment (Donor)

1. **Switch Back to Donor Account**
   - Log in as donor
   - Navigate to `/donor`

2. **View Incoming Requests**
   - In "Active Surplus Offers" section
   - Click "View Requests" on the biryani offer
   - Should see recipient's request with status "PENDING"

3. **Approve Request** ← **TRIGGER POINT**
   - Click "Approve" button
   - Check browser console for success message
   - **Behind the scenes:**
     - Request status changes to APPROVED
     - Assignment is created in `volunteer_assignments` collection
     - Assignment includes organization city ("Mumbai")

4. **Verify Assignment in Database**
   ```javascript
   // In MongoDB, check volunteer_assignments collection:
   db.volunteer_assignments.findOne({ surplusId: "<offer-id>" })
   // Should show:
   {
     surplusId: "...",
     donorOrg: "Test Café",
     donorCity: "Mumbai",  // ← FROM ORGANIZATION
     status: "ASSIGNED",
     ...
   }
   ```

---

### Phase 5: Volunteer Setup (Volunteer)

1. **Log in to Volunteer Dashboard**
   - Navigate to `/volunteer`
   - Current user: Test volunteer account

2. **Check/Update Volunteer Profile**
   - Click "Edit Profile"
   - Ensure:
     - Name: "Test Volunteer"
     - City: "Mumbai" ← **MUST MATCH ORGANIZATION CITY**
     - Vehicle Type: "Two-wheeler"
     - Age: "25"
   - Click "Save Profile"

3. **Dashboard Should Fetch Assignments**
   - Browser makes request: `/api/volunteer-assignments?volunteerCity=Mumbai`
   - API filters assignments where donorCity === "Mumbai"
   - ✓ Assignment should appear in "Assigned to Me" tab

---

### Phase 6: Accept Task (Volunteer)

1. **View "Assigned to Me" Tab**
   - Should see task card:
     ```
     TASK-ID: Biryani Trays (30 plates)
     Donor: Test Café
     Address: 123 Main Street
     Pickup: Today 2:00 - 4:00 PM
     Status: ASSIGNED
     
     [Accept Task] [Reject]
     ```

2. **Click "Accept Task"**
   - Makes PATCH request: `/api/volunteer-assignments`
   - Updates status: ASSIGNED → ACCEPTED
   - Volunteer ID is recorded
   - Task moves to "Accepted Tasks" tab
   - **"Tasks Accepted Today" counter increments to 1**

3. **Verify in Database**
   ```javascript
   db.volunteer_assignments.findOne({ _id: ObjectId("...") })
   // Should show:
   {
     status: "ACCEPTED",
     volunteerId: "...",
     acceptedAt: <timestamp>,
     ...
   }
   ```

---

### Phase 7: Mark Delivered (Volunteer)

1. **In "Accepted Tasks" Tab**
   - Should see the accepted task
   - Button now says "Mark Delivered" (changed from "Accept Task")

2. **Click "Mark Delivered"**
   - Makes PATCH request: `/api/volunteer-assignments`
   - Updates status: ACCEPTED → COMPLETED
   - Completion timestamp recorded
   - Task removed from active tabs
   - **"Tasks Completed" counter increments to 1**

3. **Verify in Database**
   ```javascript
   db.volunteer_assignments.findOne({ _id: ObjectId("...") })
   // Should show:
   {
     status: "COMPLETED",
     completedAt: <timestamp>,
     ...
   }
   ```

4. **Verify Counters**
   - Tasks Accepted Today: 0 (no longer ACCEPTED status)
   - Tasks Completed: 1 (now COMPLETED)

---

### Phase 8: Test City Filtering (Volunteer)

1. **Update Volunteer City**
   - Click "Edit Profile"
   - Change city to "Delhi"
   - Click "Save Profile"

2. **Refresh Dashboard**
   - Dashboard fetches assignments with `volunteerCity=Delhi`
   - API filters: donorCity === "Delhi"
   - ✗ Assignment should DISAPPEAR (Mumbai ≠ Delhi)
   - "Assigned to Me" tab should be empty

3. **Change City Back**
   - Click "Edit Profile"
   - Change city back to "Mumbai"
   - Click "Save Profile"
   - ✓ Assignment should REAPPEAR

---

### Phase 9: Test Reject Functionality

1. **Create Another Offer**
   - Repeat Phase 2 with different item
   - Get it approved by recipient (Phase 3-4)

2. **As Volunteer, Click "Reject"**
   - Makes PATCH request: `/api/volunteer-assignments`
   - Updates status: ASSIGNED → REJECTED
   - Task is removed from "Assigned to Me" tab
   - Task should not appear again

3. **Verify in Database**
   ```javascript
   db.volunteer_assignments.findOne({ status: "REJECTED" })
   // Should exist for the rejected task
   ```

---

## Troubleshooting

### Task not appearing in "Assigned to Me"
- Check: Volunteer city === Organization city
- Check: Assignment status is "ASSIGNED" or "ACCEPTED"
- Check: MongoDB has the assignment record

### "Accept Task" button not working
- Check: Browser console for errors
- Check: API endpoint is accessible
- Verify: Assignment ID is correct

### "Tasks Accepted Today" not incrementing
- Check: Assignment status actually changed to "ACCEPTED"
- Check: Dashboard is refetching assignments
- Try: Refresh the page

### "Tasks Completed" not incrementing
- Check: Assignment status changed to "COMPLETED"
- Check: completedAt timestamp is set
- Verify: Database record shows correct status

---

## Expected Results Summary

| Action | Expected Result |
|--------|-----------------|
| Create org with city "Mumbai" | City saved in DB |
| Approve recipient request | Assignment created with donorCity |
| Volunteer city = "Mumbai" | Assignment appears in dashboard |
| Volunteer city = "Delhi" | Assignment disappears |
| Click "Accept Task" | Status → ACCEPTED, Tasks Accepted Today = 1 |
| Click "Mark Delivered" | Status → COMPLETED, Tasks Completed = 1 |
| Click "Reject" | Status → REJECTED, Task removed |
| Complete multiple tasks | Tasks Completed keeps growing |

---

## Monitoring Tools

### Real-Time Logs
1. Open browser DevTools (F12)
2. Go to Console tab
3. Watch for API request/response logs

### Database Monitoring
```javascript
// Monitor assignments collection
db.volunteer_assignments.find({}).pretty()

// Check specific assignment
db.volunteer_assignments.findOne({ donorCity: "Mumbai" })

// Count by status
db.volunteer_assignments.countDocuments({ status: "ACCEPTED" })
db.volunteer_assignments.countDocuments({ status: "COMPLETED" })
```

### API Testing
Use Postman or curl:
```bash
# Fetch assignments
curl "http://localhost:3000/api/volunteer-assignments?volunteerCity=Mumbai"

# Accept task
curl -X PATCH "http://localhost:3000/api/volunteer-assignments" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "...",
    "status": "ACCEPTED",
    "volunteerId": "..."
  }'
```
