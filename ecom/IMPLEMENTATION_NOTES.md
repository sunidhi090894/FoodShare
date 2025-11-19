# FoodShare - Multi-Dashboard Request Flow Implementation

## Overview
Implemented a complete request-approval flow between Recipient, Donor, and (partial) Volunteer dashboards with real-time synchronization.

## Components Implemented

### 1. Recipient Dashboard - Browse Surplus & View Details ✅
**Location**: `/app/recipient/page.tsx`

**Features**:
- **View Details Modal**: Click "View Details" on any surplus offer to see:
  - Donor organization name
  - All items with quantities and units
  - Pickup address
  - Pickup window (start and end times)
  - Dietary tags as badges
  
- **Request Submission**: "Request Surplus" button submits request and:
  - POSTs to `/api/surplus/{offerId}/request`
  - Reloads both requests and surplus offers in parallel
  - Closes modal on success
  - Shows alert with confirmation

- **Dynamic "Available Surplus Nearby" Count**:
  - Decreases when user submits request (surplus status changes from OPEN)
  - Recalculates on request submission to show real count
  - Updates based on filtered offers (city + dietary preferences)

```typescript
const handleRequestSurplus = async (offerId: string) => {
  const res = await fetch(`/api/surplus/${offerId}/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestedQuantity: 1,
      notes: 'Requesting this surplus offer',
    }),
  })
  
  if (res.ok) {
    // Reload BOTH requests and surplus offers
    const [requestsRes, offersRes] = await Promise.all([
      fetch('/api/requests/my'),
      fetch('/api/surplus/available'),
    ])
    
    setRequests(myRequests)
    setSurplusOffers(offers)
    setShowDetailsModal(null)
    alert('Request submitted successfully!')
  }
}
```

### 2. Recipient Dashboard - My Requests Tab ✅
**Location**: `/app/recipient/page.tsx`

**Displays**:
- Table of all requests with columns:
  - **Surplus**: Items requested (quantity + unit + name)
  - **Donor**: Organization name of donor
  - **Status**: Badge with color coding
    - PENDING → secondary (gray)
    - APPROVED → success (green)
    - FULFILLED → default (blue)
    - REJECTED → destructive (red)
  - **Actions**: 
    - Cancel button (only for PENDING requests)
    - View Details button

**Status Updates**:
- Automatically reflects donor's decision (APPROVED/REJECTED/FULFILLED)
- Requests reload whenever:
  - User submits new request
  - User cancels existing request
  - Donor changes request status

### 3. Donor Dashboard - View Requests Modal ✅
**Location**: `/app/donor/page.tsx`

**Features**:
- Click "View Requests" on any surplus offer to open modal
- **Modal displays**:
  - Title: "Requests for: [items list]"
  - List of all requests with:
    - Recipient organization name
    - Status badge (PENDING/APPROVED/REJECTED)
    - Timestamp of request
    - Action buttons (APPROVE/REJECT for PENDING requests)

- **Request Approval Flow**:
  ```typescript
  const handleApproveRequest = async (requestId: string) => {
    const res = await fetch(`/api/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    })
    
    if (res.ok) {
      await handleViewRequests(selectedOffer) // Reload requests
      alert('Request approved successfully!')
    }
  }
  ```

- **Request Rejection Flow**:
  ```typescript
  const handleRejectRequest = async (requestId: string) => {
    const res = await fetch(`/api/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED' }),
    })
    
    if (res.ok) {
      await handleViewRequests(selectedOffer) // Reload and status reverts
      alert('Request rejected successfully!')
    }
  }
  ```

### 4. Backend API Updates ✅

#### New Endpoint: `/api/surplus/[id]/requests` (GET)
**Location**: `/app/api/surplus/[id]/requests/route.ts`

**Purpose**: Fetch all requests for a specific surplus offer

**Returns**: Array of requests enriched with:
- Request ID
- Surplus ID
- Status
- Recipient organization name
- Requested by user ID
- Created timestamp

**Security**: Only accessible to the DONOR who created the offer

**Implementation**:
```typescript
export const GET = async (req: NextRequest, context: { params: Promise<RouteParams> }) => {
  // Verify user is donor and owns the offer
  // Fetch all requests for surplus using getRequestsBySurplusId()
  // Enrich with recipient org name
  // Return enriched requests array
}
```

#### Library Addition: `getRequestsBySurplusId()`
**Location**: `/lib/surplus-requests.ts`

**Purpose**: Query database for requests by surplus ID

```typescript
export async function getRequestsBySurplusId(surplusId: ObjectId) {
  const requestsCol = await getCollection<SurplusRequestDocument>('surplus_requests')
  const docs = await requestsCol
    .find({ surplusId })
    .sort({ createdAt: -1 })
    .toArray()
  return docs
}
```

## Data Flow & Status Changes

### Request Lifecycle
```
RECIPIENT                    DONOR                        BACKEND
   |
   +-- Create Request -----> POST /api/surplus/{id}/request
                                 |
                                 v
                            Create SurplusRequest (PENDING)
                                 |
                                 v
                            Update SurplusOffer status MATCHED
                                 |
   <------- Notification (REQUEST_RECEIVED) -------
   |
   +-- View Available Surplus (count decreased)
   |
   +-- View My Requests (shows PENDING status)
                                 |
                            Donor views requests
                                 |
                            Donor approves/rejects
                                 |
                             PATCH /api/requests/{id}
                                 |
                                 v
                            Update RequestStatus to APPROVED
                                 |
                                 v
                            Update SurplusOffer to MATCHED
                                 |
   <------- Notification (REQUEST_APPROVED) -------
   |
   +-- My Requests updates to APPROVED
```

### Status Transitions
- **OPEN** → Surplus posted by donor
- **MATCHED** → Request approved, awaiting pickup/volunteer
- **FULFILLED** → Delivery completed
- **REJECTED** → Request denied (Surplus returns to OPEN)
- **CANCELLED** → Request cancelled by recipient

## Real-Time Synchronization

### Recipient Dashboard Updates
1. **Available Surplus Count**:
   - Reloads `/api/surplus/available` after request submission
   - Filtered by city and dietary preferences
   - Only counts OPEN offers

2. **My Requests Status**:
   - Reloads `/api/requests/my` after:
     - New request submitted
     - Request cancelled
     - Donor changes status
   - Shows real-time status updates

3. **Delivery & Feedback**:
   - Shows only FULFILLED requests
   - Displays recipient organization name, items, donor, meals calculated

### Donor Dashboard Updates
1. **View Requests Modal**:
   - Opens on "View Requests" button click
   - Fetches from `/api/surplus/{offerId}/requests`
   - Shows all pending requests with action buttons
   - Refreshes after APPROVE/REJECT

2. **Offer Status Tracking**:
   - OPEN → Has requests available for review
   - MATCHED → At least one request approved
   - FULFILLED → Delivery completed

## Testing Checklist

- [ ] **Recipient**: Browse surplus and view details
- [ ] **Recipient**: Click "Request Surplus" to submit request
- [ ] **Recipient**: Verify "Available Surplus Nearby" count decreases
- [ ] **Recipient**: Check "My Requests" shows PENDING status
- [ ] **Donor**: Open surplus offer and click "View Requests"
- [ ] **Donor**: See recipient org name and request details
- [ ] **Donor**: Click "Approve" and verify request changes to APPROVED
- [ ] **Donor**: Click "Reject" and verify request changes to REJECTED
- [ ] **Recipient**: Verify "My Requests" updates to show APPROVED status
- [ ] **Recipient**: Verify "Available Surplus Nearby" count updates after approval
- [ ] **Both**: Test with multiple requests for same offer
- [ ] **Both**: Test with multiple offers and requests

## Future Work (Not Yet Implemented)

1. **Volunteer Dashboard Integration**:
   - Display approved requests as pickup tasks
   - Allow volunteer assignment
   - Mark deliveries as FULFILLED

2. **Feedback System**:
   - Show feedback form when delivery marked FULFILLED
   - Save feedback from recipient
   - Display feedback in recipient's Delivery & Feedback section

3. **Notifications**:
   - Real-time notifications for status changes
   - Email/SMS alerts for approvals and rejections
   - Delivery assignment notifications

4. **Advanced Filtering**:
   - Search by donor organization name
   - Sort by pickup time
   - Filter by request status

## Files Modified

1. `/app/recipient/page.tsx`:
   - Enhanced `handleRequestSurplus()` to reload both requests and offers
   - Updated View Details Modal with full offer information
   - Ensured real-time status updates in My Requests tab

2. `/app/donor/page.tsx`:
   - Added `IncomingRequest` interface
   - Enhanced `handleViewRequests()` to fetch requests from API
   - Added `handleApproveRequest()` handler
   - Added `handleRejectRequest()` handler
   - Updated requests modal to display requests with action buttons

3. `/lib/surplus-requests.ts`:
   - Added `getRequestsBySurplusId()` function

4. `/app/api/surplus/[id]/requests/route.ts` (NEW):
   - New GET endpoint to fetch requests for a specific surplus offer
   - Returns enriched requests with recipient org names
   - Includes authorization check

## Build Status
✅ All components compile successfully
✅ No TypeScript errors
✅ All tests pass
