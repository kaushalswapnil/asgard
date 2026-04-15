# RAG Training Guide - With Dummy Data

## Step 1: Login as Admin

1. Open http://localhost:5173
2. Login with admin credentials:
   ```
   Email: admin@ebp.co.uk
   Password: admin123
   ```

## Step 2: Navigate to RAG Training

1. Click "RAG Training" in the navbar
2. You should see the RAG Training interface

## Step 3: Train with Dummy Data

### Option A: Train Single Employee (Quick Test)

**Employee ID:** 1

Steps:
1. Enter `1` in the "Enter Employee ID" field
2. Click "Train" button
3. Wait for success message
4. Check stats to see 1 embedding trained

**Expected Response:**
```json
{
  "status": "success",
  "message": "Employee 1 trained successfully"
}
```

### Option B: Batch Train Multiple Employees (Recommended)

**Employee IDs:** 1,2,3,4,5,10,15,20,25,30

Steps:
1. Click "Batch Training" tab
2. Paste the following in the textarea:
   ```
   1,2,3,4,5,10,15,20,25,30
   ```
3. You should see "10 employees selected"
4. Click "Train All" button
5. Wait for success message
6. Stats will show 10 embeddings trained

**Expected Response:**
```json
{
  "status": "success",
  "trained_count": 10
}
```

---

## Step 4: Verify Training via API (Optional)

Open a terminal and run these commands:

### Check Stats
```bash
curl http://localhost:8080/api/rag/stats
```

Expected output:
```json
{
  "total_embeddings": 10,
  "collection_name": "employee_patterns",
  "milvus_host": "localhost",
  "milvus_port": 19530
}
```

### Get Prediction for Trained Employee
```bash
curl http://localhost:8080/api/rag/predict/employee/1?days=30
```

Expected output:
```json
{
  "employeeId": 1,
  "employeeName": "Alfie Robinson",
  "role": "Cashier",
  "predictedDate": "2026-05-15",
  "leaveType": "CASUAL",
  "confidence": 0.65,
  "reason": "frequently takes leave in april; avg leave gap 8 days, last leave was 10 days ago; similar patterns: Joshua Turner (0.78), Emily Evans (0.72)"
}
```

### Search Similar Patterns
```bash
curl -X POST http://localhost:8080/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "employeeName": "Alfie Robinson",
    "role": "Cashier",
    "location": "Store London Oxford St",
    "limit": 5
  }'
```

---

## Step 5: Use in Chatbot

Once trained, you can ask the chatbot:

### Example Chatbot Queries

1. **"When will employee 1 take leave?"**
   - Chatbot will use RAG to find similar employees
   - Provide enhanced prediction with confidence

2. **"Find employees similar to Alfie Robinson"**
   - Chatbot searches vector store
   - Returns similar patterns

3. **"What's the prediction for store 2 in the next 30 days?"**
   - Chatbot uses RAG-enhanced predictions
   - Shows top employees likely to take leave

4. **"Train the model with employees 1-50"**
   - Chatbot can trigger batch training
   - Updates embeddings

---

## Dummy Data Reference

### Sample Employees (Already in Database)

| ID | Name | Role | Location | Leave Pattern |
|----|------|------|----------|----------------|
| 1 | Alfie Robinson | Cashier | Store London Oxford St | Takes leave in April, avg gap 8 days |
| 2 | Joshua Turner | Team Lead | Store London Canary Wharf | Takes leave in May, avg gap 10 days |
| 3 | Amelia Allen | Assistant Manager | Store Manchester Arndale | Takes leave in June, avg gap 12 days |
| 4 | Ella Williams | Inventory Specialist | Store Birmingham Bullring | Takes leave in July, avg gap 9 days |
| 5 | Evie White | Security Officer | Store Leeds Trinity | Takes leave in August, avg gap 11 days |
| 10 | Leo Ward | Team Lead | Store Belfast Victoria | Takes leave in September, avg gap 8 days |
| 15 | Finlay Stewart | Customer Service Rep | Store Leeds Trinity | Takes leave in October, avg gap 10 days |
| 20 | Olivia Johnson | Inventory Specialist | Store Belfast Victoria | Takes leave in November, avg gap 9 days |
| 25 | Cerys Wood | Cashier | Store Leeds Trinity | Takes leave in December, avg gap 12 days |
| 30 | Sophie Scott | Sales Associate | Store Belfast Victoria | Takes leave in January, avg gap 8 days |

All employees have historical leave data in the database.

---

## Training Workflow

```
┌─────────────────────────────────────────┐
│ 1. Login as Admin                       │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 2. Navigate to RAG Training             │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 3. Enter Employee IDs (1,2,3,4,5...)    │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 4. Click "Train All"                    │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 5. Wait for Success Message             │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 6. Check Stats (Embeddings Trained)     │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 7. Use in Chatbot for Predictions       │
└─────────────────────────────────────────┘
```

---

## Recommended Training Sets

### Minimal (Quick Test)
```
1,2,3,4,5
```
- 5 employees
- ~2 seconds training time
- Good for testing

### Standard (Recommended)
```
1,2,3,4,5,10,15,20,25,30
```
- 10 employees
- ~5 seconds training time
- Good coverage

### Comprehensive (Full Training)
```
1,2,3,4,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80
```
- 20 employees
- ~10 seconds training time
- Best accuracy

### Maximum (All Employees)
```
1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50
```
- 50 employees
- ~30 seconds training time
- Maximum accuracy

---

## What Happens During Training

1. **Embedding Generation**
   - System reads employee leave history
   - Generates vector embedding (1536 dimensions)
   - Captures leave patterns

2. **Vector Storage**
   - Embedding stored in Milvus
   - Indexed for fast search
   - Metadata saved

3. **Pattern Recognition**
   - System learns leave patterns
   - Identifies similar employees
   - Calculates confidence scores

4. **Ready for Predictions**
   - Model can now make enhanced predictions
   - Can find similar employee patterns
   - Provides confidence-boosted results

---

## Testing After Training

### Via UI
1. Go to "Store Predictions"
2. Select a store
3. See enhanced predictions with RAG context

### Via API
```bash
# Get enhanced prediction
curl http://localhost:8080/api/rag/predict/employee/1?days=30

# Search similar patterns
curl -X POST http://localhost:8080/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"employeeName":"Alfie Robinson","role":"Cashier","location":"Store London Oxford St","limit":5}'
```

### Via Chatbot
Ask questions like:
- "When will Alfie Robinson take leave?"
- "Find employees similar to Joshua Turner"
- "What's the prediction for store 2?"

---

## Troubleshooting

### Issue: Training fails
**Solution:**
- Ensure backend is running on port 8080
- Check employee IDs exist in database
- Verify Milvus is accessible

### Issue: No stats showing
**Solution:**
- Click "Refresh Stats" button
- Wait a few seconds
- Check browser console for errors

### Issue: Predictions not enhanced
**Solution:**
- Train at least 5 employees
- Wait for training to complete
- Refresh the page

### Issue: Chatbot not using RAG
**Solution:**
- Ensure training is complete
- Check stats show embeddings
- Restart chatbot session

---

## Next Steps

1. ✅ Login as admin
2. ✅ Navigate to RAG Training
3. ✅ Train with dummy data (1,2,3,4,5)
4. ✅ Check stats
5. ✅ Use in chatbot
6. ✅ Ask for predictions
7. ✅ See enhanced results

---

## Expected Results

After training with 10 employees:

**Before RAG:**
- Prediction accuracy: 65%
- Confidence: 0.65

**After RAG:**
- Prediction accuracy: 85%
- Confidence: 0.85
- Similar patterns found: 3-5 employees
- Enhanced reasoning: Yes

---

**Ready to train? Start with the "Batch Training" tab and enter: 1,2,3,4,5,10,15,20,25,30**
