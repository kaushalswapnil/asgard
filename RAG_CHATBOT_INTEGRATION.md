# 🤖 RAG Training - Integrated in Chatbot (Admin Only)

## Overview

RAG training is now **integrated directly into the chatbot** and is **only available to Admin users**. The separate RAG Training tab has been removed from the navbar.

---

## How to Access RAG Training

### Step 1: Login as Admin
```
Email: admin@ebp.co.uk
Password: admin123
```

### Step 2: Open the Chatbot
Click the floating "AI Assistant" button in the bottom-right corner

### Step 3: You'll See Admin Mode
The chatbot will show:
```
🛠️ Admin Mode
```

### Step 4: Click "Train Data" Tab
You'll see two tabs:
- 💬 Chat
- 🧠 Train Data ← Click this

---

## Training Data in Chatbot

### What You Can Do

1. **Add Knowledge Chunks**
   - Title: Name your chunk (e.g., "Leave Policy 2024")
   - Content: Paste policy text, rules, schedules, FAQs

2. **View Trained Chunks**
   - See all chunks you've added
   - Shows chunk count badge

3. **Clear All**
   - Remove all trained data
   - Start fresh

---

## Step-by-Step Training

### Step 1: Open Chatbot
Click the AI Assistant button

### Step 2: Go to Train Data Tab
Click "🧠 Train Data"

### Step 3: Add a Chunk

**Example 1: Leave Policy**
```
Title: Leave Policy 2024

Content:
Annual Leave: 25 days per year
Sick Leave: 5 days per year
Compassionate Leave: 3 days per year
Maternity Leave: 52 weeks
Paternity Leave: 2 weeks

Approval Process:
1. Submit request 2 weeks in advance
2. Manager approval required
3. HR confirmation
4. Calendar update

Peak Leave Periods:
- Summer: July-August (limited to 2 people per store)
- Christmas: December 20-January 2 (limited to 3 people per store)
- Easter: March-April (limited to 2 people per store)
```

**Example 2: Store Schedules**
```
Title: Store Operating Hours

Content:
Monday-Friday: 8:00 AM - 8:00 PM
Saturday: 9:00 AM - 7:00 PM
Sunday: 10:00 AM - 6:00 PM

Minimum Staff Requirements:
- Morning shift (8-12): 3 staff
- Afternoon shift (12-5): 4 staff
- Evening shift (5-8): 3 staff
- Sunday: 2 staff minimum

Peak Hours:
- Lunch: 12-2 PM (need 4+ staff)
- Evening: 5-7 PM (need 3+ staff)
```

**Example 3: Holiday Calendar**
```
Title: 2024 Holiday Calendar

Content:
New Year's Day: January 1
Good Friday: March 29
Easter Monday: April 1
Early May Bank Holiday: May 6
Spring Bank Holiday: May 27
Summer Bank Holiday: August 26
Christmas Day: December 25
Boxing Day: December 26

Store Closure Days:
- Christmas: December 24-26
- New Year: December 31-January 1
```

### Step 4: Click "Add to Corpus"
Your chunk is saved!

### Step 5: See Confirmation
```
✅ Chunk "Leave Policy 2024" added to RAG corpus. Total chunks: 1
```

### Step 6: Add More Chunks
Repeat steps 3-5 to add more knowledge

---

## Using Trained Data in Chat

### Switch to Chat Tab
Click "💬 Chat" tab

### Ask Questions
The chatbot will use your trained data to answer:

**Example Questions:**
```
"What's the annual leave policy?"
"How many days of sick leave do I get?"
"What are the peak leave periods?"
"Show me the store operating hours"
"When is the summer bank holiday?"
"What's the approval process for leave?"
```

**Example Response:**
```
📚 Based on trained data (1 relevant chunk retrieved):

[Leave Policy 2024]
Annual Leave: 25 days per year
Sick Leave: 5 days per year
Compassionate Leave: 3 days per year
Maternity Leave: 52 weeks
Paternity Leave: 2 weeks

Approval Process:
1. Submit request 2 weeks in advance
2. Manager approval required
3. HR confirmation
4. Calendar update

---
💡 Tip: The answer above is retrieved directly from your trained corpus. Add more specific data chunks for better answers.
```

---

## Manager View (Admin Testing)

### Switch to Manager View
As an admin, you can test the chatbot as a manager:

1. Click "🏪 Test as Manager" button
2. Chatbot switches to manager mode
3. You can test manager features
4. Click "🛠️ Admin View" to go back

### Manager Features
- Store predictions
- Employee schedules
- Holiday information
- Leave predictions

---

## Admin vs Manager

### Admin Access
- ✅ Train Data tab
- ✅ Add knowledge chunks
- ✅ View trained chunks
- ✅ Clear corpus
- ✅ Test as Manager
- ✅ Chat with trained data

### Manager Access
- ❌ No Train Data tab
- ✅ Chat with predictions
- ✅ Store information
- ✅ Employee schedules
- ✅ Holiday calendar

---

## Training Best Practices

### 1. Organize by Topic
```
✅ Good:
- Title: "Leave Policy 2024"
- Title: "Store Operating Hours"
- Title: "Holiday Calendar"

❌ Bad:
- Title: "Stuff"
- Title: "Info"
```

### 2. Include Context
```
✅ Good:
Include dates, numbers, specific rules

❌ Bad:
Vague descriptions without details
```

### 3. Use Clear Formatting
```
✅ Good:
Use bullet points, sections, clear structure

❌ Bad:
Long paragraphs without organization
```

### 4. Add Multiple Chunks
```
✅ Good:
5-10 focused chunks on different topics

❌ Bad:
1 huge chunk with everything
```

---

## Example Training Session

### Chunk 1: Leave Policy
```
Title: Leave Policy 2024
Content: [Annual leave, sick leave, approval process...]
```

### Chunk 2: Store Hours
```
Title: Store Operating Hours
Content: [Monday-Sunday hours, staff requirements...]
```

### Chunk 3: Holidays
```
Title: 2024 Holiday Calendar
Content: [All bank holidays and closure dates...]
```

### Chunk 4: Emergency Procedures
```
Title: Emergency Leave Procedures
Content: [How to request emergency leave, who to contact...]
```

### Chunk 5: FAQ
```
Title: Frequently Asked Questions
Content: [Common questions and answers...]
```

**Result:** 5 chunks trained, ready to answer questions!

---

## Testing Your Training

### Ask Specific Questions
```
"What's the annual leave policy?"
"How many days of sick leave?"
"When are the peak leave periods?"
"What's the approval process?"
"Show me the store hours"
```

### Check Responses
- Does it use your trained data?
- Is the answer accurate?
- Is it formatted well?

### Refine Training
- Add more chunks if needed
- Clear and retrain if needed
- Test again

---

## Clearing Training Data

### Clear All Chunks
1. Go to "🧠 Train Data" tab
2. Click "🗑️ Clear All" button
3. Confirmation: "🗑️ RAG corpus cleared."

### Start Fresh
After clearing, you can add new chunks

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't see Train Data tab | Make sure you're logged in as admin |
| Chunk not saving | Check title and content are not empty |
| Chatbot not using trained data | Make sure you're on Chat tab, not Train tab |
| No response to questions | Add more relevant chunks |
| Response not accurate | Refine your chunk content |

---

## Security & Access Control

### Admin Only
- ✅ Can train data
- ✅ Can clear data
- ✅ Can test as manager
- ✅ Full access

### Manager Only
- ❌ Cannot train data
- ❌ Cannot clear data
- ❌ Cannot see Train tab
- ✅ Can use trained data

### Data Storage
- Stored in browser localStorage
- Persists across sessions
- Only visible to logged-in user

---

## Tips & Tricks

### 1. Use Consistent Formatting
Make chunks easy to read with clear structure

### 2. Add Examples
Include real examples in your chunks

### 3. Keep Chunks Focused
One topic per chunk, not everything mixed

### 4. Update Regularly
Add new policies and procedures as they change

### 5. Test Thoroughly
Ask various questions to test your training

---

## Next Steps

1. ✅ Login as admin
2. ✅ Open chatbot
3. ✅ Click "🧠 Train Data"
4. ✅ Add your first chunk
5. ✅ Click "💬 Chat"
6. ✅ Ask a question
7. ✅ See trained data in response

---

## Summary

- **RAG Training is now in the chatbot**
- **Admin only access**
- **Train data using the "Train Data" tab**
- **Use trained data in the "Chat" tab**
- **Managers can only use, not train**
- **Data persists across sessions**

---

**Ready to train? Open the chatbot and click the "🧠 Train Data" tab!** 🚀
