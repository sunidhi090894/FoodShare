# 🧪 Quick Testing Guide

## Test 1: Admin Role Persistence (5 minutes)

### Steps:
```
1. Sign up: 
   - Email: admin-test@example.com
   - Password: Test1234!
   - Role: ADMIN

2. Close browser completely (⌘Q or close window)

3. Reopen browser and navigate to login

4. Log in with same credentials

5. Check user profile:
   - Open browser DevTools (F12)
   - Console tab
   - Paste: await fetch('/api/users/me').then(r => r.json())
   - Look for: "role": "ADMIN"

✅ Expected: role === "ADMIN"
❌ Bug: role === "DONOR"
```

### What was fixed:
- Admin role no longer gets overwritten when creating an organization
- Role preservation logic added in `/lib/organizations.ts`

---

## Test 2: Surplus Order Persistence (10 minutes)

### Part A: Create Order
```
1. Log in as DONOR (or create donor account)

2. Click "Create Surplus Offer"

3. Add items:
   - Item name: "Test Rice"
   - Quantity: 50
   - Unit: kg

4. Set pickup window:
   - Start: Today 10:00 AM
   - End: Today 4:00 PM

5. Click "Create Offer" ✅

6. Verify it appears in "Active Surplus Offers" table

7. Note: Order ID or item name
```

### Part B: Close and Reopen
```
1. Close browser completely (⌘Q)

2. Reopen browser

3. Log in with same DONOR account

4. Check Donor Dashboard

✅ Expected: "Test Rice" order still visible
❌ Bug: Order disappeared
```

### Part C: Check Recipient View
```
1. Log out from donor account

2. Log in as RECIPIENT

3. Go to /recipient dashboard

4. Check surplus offers

✅ Expected: "Test Rice" order visible
   (This confirms data IS in MongoDB)
   
If visible in recipient but NOT in donor:
→ Issue is with query filter or caching
```

---

## Debug Commands (Copy & Paste)

### In Browser Console (F12 → Console tab):

```javascript
// Check current user
const user = await fetch('/api/users/me').then(r => r.json())
console.log('Current User:', user)
console.log('User ID:', user.id)
console.log('User Role:', user.role)

// Check donor's own orders
const myOffers = await fetch('/api/surplus/my').then(r => r.json())
console.log('My Offers:', myOffers)
console.log('Number of offers:', myOffers.length)

// Check what recipient sees (available offers)
const available = await fetch('/api/surplus/available').then(r => r.json())
console.log('Available Offers:', available)
console.log('Number available:', available.length)
```

### Network Debugging:
```
1. Open DevTools (F12)
2. Click "Network" tab
3. Refresh page
4. Look for these requests:
   - GET /api/users/me
   - GET /api/surplus/my
   - GET /api/organizations/[id]

5. Click each request to see:
   - Status: Should be 200
   - Response: Check actual data returned
```

---

## Troubleshooting Table

| Problem | Test | Check |
|---------|------|-------|
| Admin role reverted | After login, check console | `user.role === "ADMIN"` |
| Offers disappeared | After reopen, check table | Orders visible in table |
| Offers visible in recipient but not donor | Check both dashboards | Data exists in DB |
| 401 Unauthorized errors | Check console logs | userId cookie set |
| No offers shown (500 error) | Check network responses | API error message |

---

## Expected Results

### If Everything Works ✅
```
DONOR Dashboard:
- Create order → Order appears immediately
- Close/reopen → Order still visible
- All metrics calculate correctly

ADMIN Account:
- Create as ADMIN → role = "ADMIN"
- Close/reopen → role still = "ADMIN"
- Can access admin features
```

### If Surplus Still Missing ❓
```
DONOR Dashboard:
- Create order → Order appears
- Close/reopen → Order GONE
- BUT visible in RECIPIENT dashboard

→ Data IS in MongoDB
→ Query filter might be wrong
→ Check /api/surplus/my response
```

---

## Report Format (If issue persists)

Please include:
```
1. Create order timestamp:
2. Order details:
3. Browser DevTools output:
   ```
   Current User: {copy from console}
   My Offers: {copy from console}
   Available Offers: {copy from console}
   ```
4. Network tab screenshots showing:
   - GET /api/surplus/my response
   - GET /api/users/me response
```

---

## Quick Verification (1 minute)

```javascript
// Paste in console - if all show TRUE, system is working
(async () => {
  const user = await fetch('/api/users/me').then(r => r.json())
  const role = user.role === 'ADMIN' ? 'ADMIN OK' : 'Role issue: ' + user.role
  
  console.log('✅ User loaded:', !!user.id)
  console.log('✅ Role status:', role)
  console.log('✅ Organization ID:', user.organizationId ? 'Set' : 'Not set')
})()
```
