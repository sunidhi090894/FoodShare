# FoodShare - Request Synchronization Implementation Summary

## What's Been Implemented

### 1. Recipient Dashboard
- **Browse Surplus**: Lists all available OPEN offers
- **View Details**: Modal showing full offer details
- **Request Surplus**: Submit request which:
  - Creates a pending request in database
  - Reloads both requests and offers lists
  - Closes modal and shows success message

### 2. Donor Dashboard  
- **View Requests**: Click button on offer to see all requests for that offer
- **Modal displays**:
  - Recipient organization name
  - Request status (PENDING/APPROVED/REJECTED)
  - Request timestamp
  - Approve/Reject buttons (only for PENDING)

### 3. Real-Time Synchronization
- Requests automatically appear in donor's "View Requests" modal
- Donor's decisions (APPROVE/REJECT) sync to recipient's "My Requests" tab
- "Available Surplus Nearby" count updates after requests

## API Endpoints

### POST /api/surplus/[id]/request
Creates a new surplus request
- **Input**: surplusId in URL
- **Output**: Created request object
- **Logs**: "Creating surplus request", "Successfully inserted request"

### GET /api/surplus/[id]/requests  
Fetches all requests for a specific offer
- **Input**: offerId in URL, userId in cookie
- **Output**: Array of enriched request objects with recipient org names
- **Logs**: "Found X requests for surplus [id]"
- **Security**: Only donor who owns offer can view

## Data Flow Diagram

```
RECIPIENT                          BACKEND                          DONOR
    |                                 |                               |
    |-- Request Surplus ---------->    |                               |
    |                         Create SurplusRequest                   |
    |                         (PENDING status)                        |
    |                                 |                               |
    |<-- Notification ----------------                               |
    |                                 |-- "View Requests" clicks      |
    |                                 |<------- API Call ------       |
    |                                 |                               |
    |                            GET /api/surplus/[id]/requests       |
    |                            Find requests where                  |
    |                            surplusId = [id]                     |
    |                            Enrich with org names                |
    |                                 |                               |
    |                            Returns array                        |
    |                                 |-------> Shows in Modal ----->|
    |                                 |                               |
    |                           Donor clicks APPROVE                  |
    |                                 |<-- PATCH /api/requests/[id]---|
    |                            Update status to APPROVED            |
    |<-- My Requests updates to APPROVED status                       |
    |                                 |                               |
```

## How to Test

### Step 1: Recipient Creates Request
1. Log in as Recipient
2. Navigate to /recipient dashboard
3. Find surplus offer in "Browse Surplus"
4. Click "View Details" or "Request" button
5. Confirm request submitted successfully
6. Check "My Requests" shows PENDING status
7. Check console: Should see "Request submitted successfully!"

### Step 2: Check Server Logs (During Step 1)
```
Creating surplus request with data: {
  surplusId: '[ObjectId]',
  recipientOrgId: '[ObjectId]',
  requestedByUserId: '[ObjectId]',
  status: 'PENDING'
}
Successfully inserted request: '[ObjectId]'
```

### Step 3: Donor Views Requests
1. Switch to/Log in as Donor
2. Go to /donor dashboard
3. Find the same surplus offer
4. Click "View Requests" button
5. Modal should open and show the request with:
   - Recipient organization name
   - PENDING status
   - Approve/Reject buttons

### Step 4: Check Donor Console
```
Fetching requests for offer [offerId]
Loaded 1 requests for offer [offerId] [array of requests]
```

### Step 5: Donor Approves/Rejects
1. In modal, click "Approve" or "Reject"
2. Should see success message
3. Modal updates to reflect new status
4. Switch back to recipient
5. "My Requests" status updates to APPROVED/REJECTED

## Troubleshooting

### Issue: "No requests" appears but you submitted a request

**Check 1: Browser Console**
- Open F12 DevTools
- Go to Console tab
- Perform steps above
- Look for any error messages

**Check 2: Server Console**
- Watch output from `npm run dev`
- Should see "Creating surplus request" log
- Should see "Found X requests" log

**Check 3: Network Tab**
- In DevTools, go to Network tab
- Click "View Requests"
- Look for `/api/surplus/[id]/requests` call
- Check Response tab for actual data returned
- Status should be 200 (or error code if fail)

**Check 4: MongoDB**
```javascript
// Check requests table
db.surplus_requests.countDocuments()

// Find requests for a specific surplus
db.surplus_requests.find({ 
  surplusId: ObjectId("66b1234...") 
}).pretty()

// Check offers
db.surplus_offers.find().limit(1).pretty()
```

## Files Changed

1. `/app/recipient/page.tsx`
   - Enhanced handleRequestSurplus() to reload both requests and offers
   - View Details modal functional with Request button

2. `/app/donor/page.tsx`
   - Added IncomingRequest interface
   - Enhanced handleViewRequests() to fetch from API
   - Added handleApproveRequest() and handleRejectRequest()
   - Updated View Requests modal to display requests

3. `/lib/surplus-requests.ts`
   - Added getRequestsBySurplusId() function
   - Added logging in createSurplusRequest()

4. `/app/api/surplus/[id]/requests/route.ts` (NEW)
   - New API endpoint to fetch requests for an offer
   - Enriches with recipient organization names
   - Includes authorization checks

## Next: Volunteer Dashboard Integration

Once the request flow is working:
1. When donor APPROVEs, create delivery task
2. Show in volunteer dashboard
3. Volunteer can claim the delivery
4. On FULFILLED, show feedback section in recipient

## Build Status

✅ All components compile without errors
✅ Ready for testing
