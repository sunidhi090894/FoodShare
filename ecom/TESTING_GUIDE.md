# Testing Guide: Request Flow Between Dashboards

## The "Forbidden" Error Explained

You got `Failed to load requests: Forbidden` because:
1. You're not logged in as a DONOR, OR
2. You're logged in as a DONOR but trying to view requests for an offer you didn't create

## Correct Testing Setup

### **Option 1: Use Two Browser Windows (Recommended)**

**Window 1 - Donor**:
1. Open http://localhost:3000
2. Log in / Sign up as DONOR
3. Create a surplus offer on `/donor/surplus/new`
4. Go to `/donor` dashboard
5. You'll see your newly created offer

**Window 2 - Recipient**:
1. Open http://localhost:3000 in a new browser window/tab (or use private/incognito window)
2. Log in / Sign up as RECIPIENT with a DIFFERENT account
3. Create an organization if prompted (go to `/recipient/organization`)
4. Go to `/recipient` dashboard
5. You should see the donor's offer in "Browse Surplus"
6. Click "View Details" → "Request Surplus"

**Back to Window 1 - Donor**:
7. Refresh `/donor` dashboard
8. Click "View Requests" on your offer
9. Should now see the recipient's request!

---

### **Option 2: Same Browser - Logout and Switch**

1. Log in as DONOR
2. Create a surplus offer
3. Go to `/donor` dashboard
4. Note the offer ID (check Network tab)
5. Log out (clear session/cookies)
6. Log in as RECIPIENT
7. Create organization
8. Go to `/recipient` - should see donor's offer
9. Click "View Details" → "Request Surplus"
10. Log out
11. Log in as DONOR again
12. Go to `/donor` → Click "View Requests"
13. Should see recipient's request

---

## Verification Checklist

### Recipient Dashboard:
- [ ] Can see "Browse Surplus" section with available offers
- [ ] Can click "View Details" to see full offer information
- [ ] Can click "Request Surplus" button
- [ ] See success message: "Request submitted successfully!"
- [ ] "Available Surplus Nearby" count decreases
- [ ] "My Requests" tab shows new request with PENDING status

### Donor Dashboard:
- [ ] Can see all your created offers
- [ ] Can click "View Requests" button on each offer
- [ ] Modal opens (may show "No requests yet" if none submitted)
- [ ] After recipient requests, requests appear with recipient name
- [ ] Can see "Approve" and "Reject" buttons for PENDING requests

### Request Status Flow:
- [ ] Recipient submits request → Shows PENDING in "My Requests"
- [ ] Donor approves → Recipient's status changes to APPROVED
- [ ] Donor rejects → Recipient's status changes to REJECTED
- [ ] When approved, recipient can prepare for delivery

---

## If You Still Get "Forbidden" Error

Check browser console (F12 → Console) - you'll now see detailed error:

**If you see**: `Forbidden: Only donors can view requests. Your role is: RECIPIENT`
- **Fix**: Log in as a DONOR account, not a RECIPIENT

**If you see**: `Not authorized: You are not the owner of this offer...`
- **Fix**: You're logged in as a DONOR, but viewing an offer created by a different DONOR
- **Solution**: Create your own offer, or use the correct donor account

**If you see**: `User not found`
- **Fix**: Log out and log back in

---

## Database Check (Advanced)

If testing doesn't work, check MongoDB:

```javascript
// Check if you have a DONOR user
db.users.findOne({ role: "DONOR" })

// Check if offers were created
db.surplus_offers.find({ status: "OPEN" }).pretty()

// Check if requests were created
db.surplus_requests.find().pretty()

// Check organizations
db.organizations.find().pretty()
```

---

## Quick Reset (If Needed)

If your database has bad test data:

```javascript
// Reset surplus requests (WARNING: deletes all requests)
db.surplus_requests.deleteMany({})

// Reset surplus offers (WARNING: deletes all offers)
db.surplus_offers.deleteMany({})
```

---

## Expected Flow Output

**When Recipient Requests**:
- Server logs: `Creating surplus request with data: {...}`
- Server logs: `Successfully inserted request: [requestId]`
- Browser shows: "Request submitted successfully!"

**When Donor Views Requests**:
- Server logs: `Found X requests for surplus [offerId]`
- Modal shows: Recipient organization name, PENDING status, Approve/Reject buttons

**When Donor Approves**:
- Request status changes to APPROVED
- Recipient's "My Requests" tab updates automatically

---

## Important Notes

⚠️ **You MUST**:
- [ ] Be logged in as a DONOR to view requests
- [ ] Be the CREATOR of the offer to view its requests
- [ ] Have a valid organization set up
- [ ] Be logged in as RECIPIENT to submit requests (from different account)
- [ ] Have a RECIPIENT organization to submit requests

✅ **What's Automatic**:
- Requests appear in donor's modal immediately after recipient submits
- Status updates sync in real-time
- "Available Surplus Nearby" count updates automatically
- Notifications are sent to donor when requests arrive

---

## Still Stuck?

Share:
1. Your exact error message
2. Screenshot of the error
3. Whether you have a DONOR account created
4. Whether you created an offer on the DONOR dashboard
