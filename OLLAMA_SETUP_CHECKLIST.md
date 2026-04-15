# Ollama Integration Setup Checklist

## Phase 1: Installation ✓

### Step 1: Install Ollama
- [ ] Download Ollama from https://ollama.ai/download
- [ ] Run installer
- [ ] Verify installation: `ollama --version`

**Status:** ⏳ Pending

---

### Step 2: Pull Mistral Model
- [ ] Open terminal/command prompt
- [ ] Run: `ollama pull mistral`
- [ ] Wait for download (5-10 minutes, ~4.1GB)
- [ ] Verify: `ollama list | grep mistral`

**Status:** ⏳ Pending

---

### Step 3: Start Ollama Server
- [ ] Run: `ollama serve`
- [ ] Verify running: `curl http://localhost:11434/api/tags`
- [ ] Keep terminal open (server runs in foreground)

**Status:** ⏳ Pending

---

## Phase 2: Backend Setup ✓

### Step 4: Build Backend
- [ ] Navigate to backend directory: `cd backend`
- [ ] Run: `mvn clean package`
- [ ] Wait for build (2-3 minutes)
- [ ] Verify: `target/backend-1.0.0-SNAPSHOT-runner.jar` exists

**Status:** ⏳ Pending

---

### Step 5: Start Backend
- [ ] Run: `java -jar target/backend-1.0.0-SNAPSHOT-runner.jar`
- [ ] Wait for startup (30-60 seconds)
- [ ] Verify: `curl http://localhost:8080/api/locations`

**Status:** ⏳ Pending

---

## Phase 3: Testing ✓

### Step 6: Test Ollama Connection
- [ ] Check backend logs for: "Ollama available: true"
- [ ] Run: `curl http://localhost:11434/api/tags`
- [ ] Verify Mistral is listed

**Status:** ⏳ Pending

---

### Step 7: Test Prediction API
- [ ] Run: `curl http://localhost:8080/api/predictions/employee/42?days=60`
- [ ] Verify response includes confidence score
- [ ] Check for LLM-enhanced reason in response

**Status:** ⏳ Pending

---

### Step 8: Test in Chatbot
- [ ] Open application in browser
- [ ] Open Chatbot (bottom right)
- [ ] Ask: `"Predict leave for employee 42"`
- [ ] Verify response shows:
  - [ ] Predicted date
  - [ ] Leave type
  - [ ] Confidence percentage
  - [ ] Natural language reason

**Status:** ⏳ Pending

---

## Phase 4: Verification ✓

### Step 9: Performance Check
- [ ] First prediction takes 2-5 seconds ✓
- [ ] Subsequent predictions are faster ✓
- [ ] Confidence is 70%+ ✓
- [ ] Reason is natural language ✓

**Status:** ⏳ Pending

---

### Step 10: Monitor Logs
- [ ] Backend logs show LLM calls
- [ ] No error messages
- [ ] Response times are acceptable
- [ ] Memory usage is stable

**Status:** ⏳ Pending

---

## Phase 5: Optimization ✓

### Step 11: Add Training Data (Optional)
- [ ] Open Chatbot → "🧠 Train Data" tab
- [ ] Add 5-10 training chunks
- [ ] Test predictions again
- [ ] Verify accuracy improved to 85%+

**Status:** ⏳ Pending

---

### Step 12: Configure for Production (Optional)
- [ ] Adjust `ollama.timeout.seconds` if needed
- [ ] Set `ollama.retry.attempts` to 5
- [ ] Enable caching in RAG config
- [ ] Monitor resource usage

**Status:** ⏳ Pending

---

## Troubleshooting Checklist

### If Ollama Not Available
- [ ] Is Ollama installed? `ollama --version`
- [ ] Is server running? `ollama serve`
- [ ] Is port 11434 open? `netstat -ano | findstr :11434`
- [ ] Check firewall settings

---

### If Model Not Found
- [ ] Is Mistral downloaded? `ollama list`
- [ ] Pull model: `ollama pull mistral`
- [ ] Check disk space (need 4.1GB)
- [ ] Check internet connection

---

### If Timeout Errors
- [ ] Increase timeout: `ollama.timeout.seconds=60`
- [ ] Check system resources (RAM, CPU)
- [ ] Restart Ollama server
- [ ] Check network connectivity

---

### If Out of Memory
- [ ] Check available RAM: `free -h` (Linux) or Task Manager (Windows)
- [ ] Use smaller model: `ollama pull neural-chat`
- [ ] Close other applications
- [ ] Increase system swap/virtual memory

---

## Success Criteria ✓

All items should be checked before considering setup complete:

- [ ] Ollama installed and running
- [ ] Mistral model downloaded
- [ ] Backend builds successfully
- [ ] Backend starts without errors
- [ ] Ollama connection verified
- [ ] Predictions return LLM-enhanced reasons
- [ ] Chatbot shows natural language explanations
- [ ] Confidence scores are 70%+
- [ ] Response times are acceptable (2-5s)
- [ ] No memory leaks or errors in logs

---

## Quick Commands Reference

```bash
# Check Ollama
ollama --version
ollama list
ollama serve

# Pull model
ollama pull mistral

# Test API
curl http://localhost:11434/api/tags
curl http://localhost:8080/api/predictions/employee/42?days=60

# Build backend
cd backend
mvn clean package

# Run backend
java -jar target/backend-1.0.0-SNAPSHOT-runner.jar

# Check ports
netstat -ano | findstr :11434  # Windows
lsof -i :11434                 # macOS/Linux
```

---

## Timeline Estimate

| Phase | Time |
|-------|------|
| Installation | 15-20 minutes |
| Backend Setup | 5-10 minutes |
| Testing | 5 minutes |
| Verification | 5 minutes |
| **Total** | **30-40 minutes** |

---

## Support

If stuck on any step:
1. Check `OLLAMA_INTEGRATION_GUIDE.md` for detailed instructions
2. Review `OLLAMA_MISTRAL_INTEGRATION_SUMMARY.md` for architecture
3. Check backend logs for error messages
4. Verify all prerequisites are installed

---

## Notes

- Keep Ollama server running in background
- First prediction is slower (model warmup)
- Subsequent predictions are faster
- No internet needed after model is downloaded
- All processing is local and private

---

**Last Updated:** 2024
**Status:** Ready for Setup
