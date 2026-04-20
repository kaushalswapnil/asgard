# Employee Replacement System — Implementation Summary

## Overview
A 4-step replacement planning system that validates employee store mappings, consumes leave risk predictions, ranks replacement candidates, and enables manager approval/override actions.

---

## Step 1: Employee Mapping

### Database Schema
- **Table**: `employee`
- **New Column**: `secondary_location_id INT REFERENCES location(id)`
- Allows dual-store assignment (primary + optional secondary)

### Seed Data
- ~70% of employees assigned a secondary store
- Secondary store always differs from primary
- ~30% have primary-only mapping

### Validation Logic (`ReplacementService.validateMapping`)
- **VALID**: Primary + secondary both present
- **MISSING_SECONDARY**: Primary present, no secondary
- **INVALID**: No primary store → blocks downstream processing

---

## Step 2: Prediction Consumption

### Integration
- Reuses existing `PredictionService.predictForStore()` and `predictForEmployee()`
- No modification to prediction model
- Filters predictions with `confidence >= 0.55` as "high-risk"

### Data Flow
```
PredictionService → ReplacementService → ReplacementResource → Frontend
```

---

## Step 3: Replacement Mapping

### Candidate Pool
1. **Same-store employees**: `location_id = at-risk employee's primary store`
2. **Secondary-store employees**: `secondary_location_id = at-risk employee's primary store`
3. Merged and deduplicated

### Filters
- Same role as at-risk employee
- Active status (`is_active = true`)
- Lower leave risk than at-risk employee
- Not on approved leave in the prediction window

### Ranking
1. **Primary alignment first** (same-store candidates ranked higher)
2. **Ascending leave risk** (safer replacements first)
3. Limited to top 3 candidates per at-risk employee

### Metadata
- `storeAlignment`: PRIMARY | SECONDARY
- `leaveRisk`: 0.0–1.0 (candidate's own risk score)
- `leaveCountLast90Days`: Recent leave activity
- `matchReason`: Human-readable explanation (e.g., "same store, role match: Cashier, risk 12%, no recent leave")

---

## Step 4: Action & Notification

### Manager Actions
- **APPROVE**: Select a candidate from the ranked list → system records the swap
- **OVERRIDE**: Reject all suggestions → manager handles manually

### Request Payload
```json
{
  "atRiskEmployeeId": 42,
  "selectedReplacementId": 87,
  "action": "APPROVE",
  "managerNote": "Confirmed with both employees"
}
```

### Response
```json
{
  "status": "APPROVED",
  "message": "Swap approved: Jane Doe will cover for John Smith",
  "atRiskEmployeeId": 42,
  "replacementEmployeeId": 87,
  "managerNote": "Confirmed with both employees"
}
```

---

## API Endpoints

### Store-Level Recommendations
```
GET /api/replacements/store/{locationId}?days=30
```
Returns all high-risk employees with ranked candidates for the store.

### Employee-Level Recommendation
```
GET /api/replacements/employee/{employeeId}?days=30
```
Returns recommendation for a single employee (404 if no high-risk prediction or invalid mapping).

### Swap Action
```
POST /api/replacements/action
Body: { atRiskEmployeeId, selectedReplacementId, action, managerNote }
```
Processes manager approval or override.

---

## Frontend UI

### Page: `/replacements`
- Store + window selector (14/30/60/90 days)
- Card per high-risk employee showing:
  - Name, role, primary/secondary stores
  - Mapping status badge (✓ Fully Mapped | ⚠ No Secondary Store)
  - Risk bar (0–100%, color-coded)
  - Predicted leave date
  - Ranked candidate list (clickable rows)
  - Manager note input
  - Approve / Override buttons
  - Action result feedback

### Design Language
- Dark theme with 3D card shadows
- Gradient risk bars (green → amber → red)
- PRIMARY/SECONDARY alignment chips
- Inline candidate selection

---

## Files Modified

### Backend
- `db/init/01_schema.sql` — added `secondary_location_id` column
- `db/init/02_seed.sql` — assigned secondary stores to ~70% of employees
- `entity/Employee.java` — added `secondaryLocation` field
- `dto/ReplacementCandidate.java` — new DTO
- `dto/ReplacementRecommendation.java` — new DTO
- `dto/SwapActionRequest.java` — new DTO
- `dto/SwapActionResponse.java` — new DTO
- `service/ReplacementService.java` — core logic (all 4 steps)
- `resource/ReplacementResource.java` — REST endpoints

### Frontend
- `api/index.js` — added 3 replacement API calls
- `pages/Replacements.jsx` — full UI implementation
- `pages/Replacements.css` — styling
- `components/Navbar.jsx` — added Replacements nav link
- `App.jsx` — registered `/replacements` route

---

## Testing Checklist

1. **Mapping Validation**
   - Verify employees with no primary store are excluded
   - Confirm MISSING_SECONDARY badge appears for employees without secondary store

2. **Candidate Filtering**
   - Ensure only same-role candidates appear
   - Verify candidates on leave in the window are excluded
   - Confirm PRIMARY alignment candidates rank higher than SECONDARY

3. **Manager Actions**
   - Test APPROVE with selected candidate → success message
   - Test OVERRIDE with no selection → override recorded
   - Verify manager note is captured in response

4. **Edge Cases**
   - Store with no high-risk employees → empty state
   - High-risk employee with no available candidates → "No available candidates" message
   - Invalid employee ID in action request → error response

---

## Future Enhancements

- Persist swap actions to a `replacement_swap` table for audit trail
- Email/Slack notifications to managers when high-risk employees detected
- Skill/certification matching beyond role name
- Multi-day availability calendar view
- Bulk approve for multiple swaps
