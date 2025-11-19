# Dashboard Summary Cards - Actual vs Predicted

## 5-Card Symmetric Layout

The donor dashboard now displays 5 metric cards in a responsive, symmetric grid:

### Layout Breakpoints:
- **Mobile**: 1 card per row
- **Tablet (md)**: 2 cards per row
- **Desktop (lg)**: 3 cards per row
- **Large Desktop (xl)**: 5 cards per row
- **Odd row centering**: If 5th card appears alone, it centers on smaller screens

---

## Card Details

### 1️⃣ Today's Surplus Posted
**Icon**: 📦 Package
**Value**: Number of OPEN offers posted today
**Helper**: Total active pickup windows

**Calculation**:
```typescript
const todayOffers = offers.filter(offer => {
  const start = new Date(offer.pickupWindowStart)
  return start.toDateString() === new Date().toDateString() && offer.status === 'OPEN'
}).length
```

**Example**: "2" offers with "4 active pickup window"

---

### 2️⃣ Actual Waste Saved Today ⭐ NEW
**Icon**: ✓ CheckCircle
**Value**: Total weight of completed orders today (kg)
**Helper**: Count of completed pickups

**Calculation**:
```typescript
const todayCompletedOffers = offers.filter(offer => {
  const now = new Date()
  const start = new Date(offer.pickupWindowStart)
  return start.toDateString() === now.toDateString() && offer.status === 'FULFILLED'
})

const actualWasteSavedToday = todayCompletedOffers.reduce((total, offer) => {
  const weight = offer.items.reduce((sum, item) => {
    return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
  }, 0)
  return total + weight
}, 0)
```

**Example**: "15 kg" with "2 completed pickups"

**Real-Time**: Updates instantly when volunteer marks offer as FULFILLED

---

### 3️⃣ Predicted Waste Saved Today
**Icon**: 🌱 Leaf
**Value**: ML-predicted weight for today (kg)
**Helper**: Confidence score (90-95%)

**Calculation**: Uses 7-step ML algorithm with:
- Day-of-week seasonality (weekday: ×0.75, weekend: ×1.25)
- Growth trend from recent offers
- Historical baseline averages
- Real-time offer integration

**Example**: "42 kg" with "ML: 92% confidence"

---

### 4️⃣ Meals Donated This Month
**Icon**: 🍽️ Utensils
**Value**: Total meals provided this month
**Helper**: Conversion formula

**Calculation**:
```typescript
const mealsThisMonth = deliveredOffers.reduce((total, offer) => {
  const totalWeight = offer.items.reduce((sum, item) => {
    return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
  }, 0)
  return total + Math.round(totalWeight * 2.2)
}, 0)
```

**Formula**: Weight (kg) × 2.2 = Meals
**Scope**: All FULFILLED offers in current month

**Example**: "287 meals" with "Formula: weight × 2.2"

---

### 5️⃣ CO₂ Saved This Month
**Icon**: ♻️ Recycle
**Value**: CO₂ equivalent prevented from landfill (kg)
**Helper**: Conversion factor

**Calculation**:
```typescript
const co2SavedThisMonth = deliveredOffers.reduce((total, offer) => {
  const totalWeight = offer.items.reduce((sum, item) => {
    return sum + (item.quantity * (item.unit === 'kg' ? 1 : 0.5))
  }, 0)
  return total + Math.round(totalWeight * 1.8)
}, 0)
```

**Formula**: Weight (kg) × 1.8 kg CO₂ = CO₂ Prevented
**Scope**: All FULFILLED offers in current month

**Example**: "517 kg" with "AaharSetu conversion factor"

---

## Actual vs Predicted Comparison

The dashboard now shows **side-by-side comparison** of:

```
┌──────────────────┐    ┌──────────────────┐
│ Actual Waste     │    │ Predicted Waste  │
│ Saved Today      │    │ Saved Today      │
├──────────────────┤    ├──────────────────┤
│ 15 kg            │    │ 42 kg            │
│ 2 completed      │    │ ML: 92%          │
│ pickups          │    │ confidence       │
└──────────────────┘    └──────────────────┘
```

### Why This Matters:

1. **Performance Tracking**: Compare actual vs ML predictions
2. **Accuracy Validation**: See if model predictions match reality
3. **Improvement Monitoring**: Track if actual numbers improve over time
4. **Data-Driven Insights**: Identify patterns in prediction accuracy

---

## Data Sources

| Card | Data Source | Real-Time? | Scope |
|------|-------------|-----------|-------|
| Today's Surplus Posted | OPEN offers (today) | ✅ Yes | Today |
| Actual Waste Saved | FULFILLED offers (today) | ✅ Yes | Today |
| Predicted Waste Saved | ML Algorithm | ✅ Hourly | Today |
| Meals Donated | FULFILLED offers | ❌ No | This Month |
| CO₂ Saved | FULFILLED offers | ❌ No | This Month |

---

## Grid Layout CSS

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
  {/* 5 cards render here */}
</div>
```

### Responsive Behavior:
- **xs (mobile)**: 1 column
- **sm (small)**: 1 column
- **md (tablet)**: 2 columns
- **lg (desktop)**: 3 columns
- **xl (large desktop)**: 5 columns (all in one row)

### Centering Logic:
When 5 cards are displayed and odd (5 % 2 = 1), the last card centers on md+ screens.

---

## Dashboard Flow

```
┌─────────────────────────────────────────┐
│          Header & Navigation            │
└─────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────┐
│        5 Summary Cards (This Section)   │
│                                         │
│  Posted | Actual | Predicted | Meals| CO₂
└─────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────┐
│      Create Surplus Offer Button        │
└─────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────┐
│    Active Surplus Offers (Table)        │
└─────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────┐
│    Impact & History (Completed Offers)  │
└─────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────┐
│    Organization Profile & Settings      │
└─────────────────────────────────────────┘
```

---

## Symmetry & Aesthetics

✅ All 5 cards have consistent styling:
- Same height and padding
- Uniform border and colors
- Matching icon styles
- Aligned typography

✅ Responsive and centered on all screen sizes

✅ Easy comparison between metrics

---

