# 🔍 Data Persistence Issues - Diagnostic Guide

## Issues Reported

### Issue #1: Surplus Orders Disappear After Page Close
**Symptom**: Donor creates surplus orders, but they disappear when closing/reopening the site. However, they ARE visible in recipient dashboard.

**Impact**: Donor doesn't see their own orders, but recipients can see them

### Issue #2: Admin Role Reverts to DONOR
**Symptom**: Admin account is created, but when logging out and back in, the role changes to DONOR

**Impact**: Admin functionality lost after re-login

---

## Root Cause Analysis

### For Surplus Order Persistence

**Data Flow**:
```
Donor creates offer
    ↓
POST /api/surplus
    ↓
createSurplusOffer() in lib/surplus-offers.ts
    ↓
MongoDB: surplus_offers.insertOne(doc)  ← Data persists here
    ↓
Frontend state: setOffers(data)
    ↓
Close/Reopen browser
    ↓
GET /api/surplus/my
    ↓
listSurplusOffersForUser(userId)
    ↓
MongoDB find: { createdByUserId: userId }  ← Should find data
    ↓
Problem: Data might not be found if userId is wrong
```

**Potential Issues**:
1. ❓ User ID in MongoDB might not match cookie userId
2. ❓ createdByUserId not being saved correctly
3. ❓ Query filter wrong in listSurplusOffersForUser()
4. ❓ Authorization check failing silently

**What We Know**:
- ✅ Recipient CAN see the orders → Data IS in MongoDB
- ✅ Creation seems to work → insertOne() succeeds
- ❌ Donor can't see their orders → Query filter might be wrong

### For Admin Role Reversion

**Data Flow**:
```
Create admin account
    ↓
registerUser() in lib/auth.ts
    ↓
role = 'ADMIN'  ← Set correctly
    ↓
MongoDB: users.insertOne({ role: 'ADMIN' })  ← Saves correctly
    ↓
Close browser (logout)
    ↓
Reopen and login
    ↓
loginUser() in lib/auth.ts
    ↓
Returns: { role: user.role }  ← Should be 'ADMIN'
    ↓
Problem: Role might be reset to DONOR somewhere
```

**Potential Issues**:
1. ❓ Role being overwritten during login
2. ❓ Role normalization resetting non-standard roles
3. ❓ User document not being fetched correctly
4. ❓ Cookie not persisting user ID correctly

---

## Diagnostic Steps

### Step 1: Check MongoDB Directly
```bash
# Connect to MongoDB
mongosh "mongodb+srv://sunidhi090894:Gappu2004@cluster0.8fvie.mongodb.net/aaharsetu-db"

# Check if surplus orders exist
db.surplus_offers.find({}).pretty()

# Check a specific donor's orders
db.surplus_offers.find({ createdByUserId: ObjectId("YOUR_USER_ID") }).pretty()

# Check user roles
db.users.find({ email: "admin@test.com" }).pretty()

# Check if role is actually ADMIN
db.users.findOne({ email: "admin@test.com" }).role
```

### Step 2: Add Browser Console Logs
Check browser developer console (F12 → Console):

```javascript
// When donor page loads, paste this:
console.log('Current user:', await fetch('/api/users/me').then(r => r.json()))
console.log('My offers:', await fetch('/api/surplus/my').then(r => r.json()))

// Check if organizationId is set
const user = await fetch('/api/users/me').then(r => r.json())
console.log('Organization ID:', user.organizationId)
```

### Step 3: Check Network Requests
Open DevTools → Network tab:

1. Create a surplus order
   - Look for POST /api/surplus
   - Check Response: Does it show `createdByUserId` matching your user ID?

2. Refresh page
   - Look for GET /api/surplus/my
   - Check Response: Is it empty or contains orders?

3. Check GET /api/users/me
   - Does `id` match the `createdByUserId` from step 1?

---

## Most Likely Causes

### For Surplus Issue
**HIGH PROBABILITY**: The `userId` being used in the query doesn't match the `createdByUserId` stored in MongoDB.

**Why**: 
- User ID stored in database might be a String instead of ObjectId
- User ID retrieved from cookie might be formatted differently

**Evidence**:
- Recipient CAN see orders → Data is definitely in DB
- Donor CAN'T see orders → Query filter failing

**Fix**: Ensure consistent ObjectId handling:
```typescript
// In listSurplusOffersForUser
const filter: Record<string, unknown> = { 
  createdByUserId: userId  // Should be ObjectId, not string
}
```

### For Admin Role Issue
**HIGH PROBABILITY**: Role normalization is resetting ADMIN → DONOR.

**Why**:
In `coerceUserRole()` function, any unrecognized role defaults to DONOR.

**Evidence**:
- Admin works until logout
- After re-login, it's DONOR
- Suggests role isn't being persisted or is being "coerced"

**Fix**: Check `coerceUserRole()` function in lib/users.ts

---

## Required Checks

### Check 1: Object ID Consistency
```typescript
// File: /app/api/surplus/my/route.ts - Line 24
const userId = cookieStore.get('userId')?.value

// ⚠️ ISSUE: userId is a STRING from cookie
// But createdByUserId in MongoDB is an OBJECTID

// FIX: Convert to ObjectId
const offers = await listSurplusOffersForUser(new ObjectId(userId), status)
```

### Check 2: Role Normalization
```typescript
// File: /lib/users.ts
export function coerceUserRole(role: string | unknown, defaultRole = 'DONOR') {
  const valid = role && typeof role === 'string' && VALID_ROLES.includes(role)
  return valid ? (role as UserRole) : defaultRole  // ⚠️ Defaults to DONOR!
}

// If ADMIN isn't in VALID_ROLES, it gets reset to DONOR
```

### Check 3: Database Query Filter
```typescript
// File: /lib/surplus-offers.ts - Line 172
export async function listSurplusOffersForUser(userId: ObjectId, status?: SurplusStatus) {
  const surplus = await getCollection<SurplusOfferDocument>('surplus_offers')
  const filter: Record<string, unknown> = { createdByUserId: userId }
  
  // ⚠️ ISSUE: userId must be ObjectId type
  // If it's a string, MongoDB won't find anything!
  
  const docs = await surplus.find(filter).sort({ createdAt: -1 }).toArray()
  return docs.map((doc) => mapSurplusOffer(doc))
}
```

---

## Action Items

- [ ] **URGENT**: Check if userId in /api/surplus/my/route.ts is being converted to ObjectId
- [ ] **URGENT**: Verify ADMIN role is in VALID_ROLES list in lib/users.ts
- [ ] Check MongoDB: Do surplus_offers contain orders with ObjectId createdByUserId?
- [ ] Check MongoDB: Does admin user have role field set to 'ADMIN' (not 'DONOR')?
- [ ] Add console.error() logs when queries return 0 results
- [ ] Test: Create order as donor → check MongoDB directly → check query response

---

## Files to Review

1. `/app/api/surplus/my/route.ts` - Line 24 (userId conversion)
2. `/lib/surplus-offers.ts` - Line 172 (listSurplusOffersForUser filter)
3. `/lib/users.ts` - Check VALID_ROLES array
4. `/lib/auth.ts` - loginUser() function
5. `/app/donor/page.tsx` - Line 151 (loadOffers error handling)

---

## Quick Fix Checklist

- [ ] Ensure `new ObjectId(userId)` in all queries
- [ ] Ensure ADMIN is in VALID_ROLES
- [ ] Add error logging to loadOffers
- [ ] Test with console logs in browser
- [ ] Verify MongoDB data directly
