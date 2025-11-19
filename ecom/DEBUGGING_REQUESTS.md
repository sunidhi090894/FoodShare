# Debugging Guide: Requests Not Showing in Donor Dashboard

## Steps to Diagnose the Issue

### Step 1: Check Browser Console (F12 or Cmd+Shift+I)

When you click "View Requests" in the donor dashboard, you should see in the browser console:
- `Fetching requests for offer [offerId]`
- Either: `Loaded X requests for offer [offerId]` (success)
- Or: `API Error: [statusCode] [errorMessage]` (error)

### Step 2: Check Server Logs

Run `npm run dev` and watch the terminal. When a recipient makes a request, you should see:
```
Creating surplus request with data: {
  surplusId: '[ObjectId]',
  recipientOrgId: '[ObjectId]',
  requestedByUserId: '[ObjectId]',
  status: 'PENDING'
}
Successfully inserted request: '[ObjectId]'
```

When donor clicks "View Requests", you should see:
```
Fetching requests for offer [offerId]
Found X requests for surplus [offerId]
```

### Step 3: Manual API Testing

Use curl or Postman to test:

```bash
# Test creating a request (replace with real IDs)
curl -X POST http://localhost:3000/api/surplus/[surplusId]/request \
  -H "Content-Type: application/json" \
  -H "Cookie: userId=[yourUserId]"

# Test fetching requests (replace with real IDs)
curl -X GET http://localhost:3000/api/surplus/[surplusId]/requests \
  -H "Cookie: userId=[donorUserId]"
```

### Step 4: Check MongoDB Directly

Connect to MongoDB and check:

```javascript
// Check if requests were created
db.surplus_requests.find({ surplusId: ObjectId("[surplusId]") }).pretty()

// Check if surplus offer exists
db.surplus_offers.findOne({ _id: ObjectId("[surplusId]") }).pretty()

// Check if recipient org exists
db.organizations.findOne({ _id: ObjectId("[recipientOrgId]") }).pretty()
```

## Common Issues & Solutions

### Issue 1: "Offer not found" error
**Cause**: The surplusId might be invalid or the offer doesn't exist
**Solution**: 
- Verify the offer ID is a valid MongoDB ObjectId
- Make sure the offer actually exists in the database

### Issue 2: "Not authorized to view requests for this offer"
**Cause**: The donor is not the owner of the offer
**Solution**:
- Log in as the same user who created the offer
- Check that the donor's userId matches the offer's createdByUserId

### Issue 3: "No requests" but requests were submitted
**Cause**: Requests are being created but not found by surplusId
**Solution**:
- Check if surplusIds in the request table match the offer ID
- Verify MongoDB query is working: `db.surplus_requests.find().limit(10).pretty()`
- Check if collection name is exactly `surplus_requests` (case-sensitive)

### Issue 4: 500 Server Error
**Cause**: Error enriching requests with organization names
**Solution**:
- Check browser console for detailed error message
- Look for "Error enriching request" in server logs
- Verify organization IDs are valid

## Implementation Checklist

- [ ] Recipient can submit request and sees "Request submitted successfully!"
- [ ] Request appears in recipient's "My Requests" tab with PENDING status
- [ ] "Available Surplus Nearby" count decreases after request
- [ ] Donor dashboard loads without errors
- [ ] Donor clicks "View Requests" and modal opens
- [ ] No error messages in browser console
- [ ] Server logs show "Found X requests for surplus [id]"
- [ ] Requests appear in the modal with recipient org name
- [ ] Donor can approve/reject requests
- [ ] Recipient's "My Requests" status updates to APPROVED/REJECTED

## Files to Check

1. `/app/api/surplus/[id]/requests/route.ts` - API endpoint
2. `/app/donor/page.tsx` - handleViewRequests() function
3. `/app/recipient/page.tsx` - handleRequestSurplus() function
4. `/lib/surplus-requests.ts` - getRequestsBySurplusId() function

## Next Steps if Still Not Working

1. Share the browser console error message
2. Share the server log output
3. Check MongoDB for documents in surplus_requests collection
4. Verify the offer ID format (should be 24-character hex string)
