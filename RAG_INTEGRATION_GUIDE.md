# RAG Integration Guide for EBP

## Overview
Retrieval-Augmented Generation (RAG) enhances your leave prediction model by:
1. **Retrieving** relevant historical employee data and patterns
2. **Augmenting** the prediction context with similar employee cases
3. **Generating** more accurate predictions using LLM reasoning

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  - Training Data Upload                                     │
│  - RAG Query Interface                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Backend (Quarkus)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  RAG Service Layer                                   │   │
│  │  - Vector Store Management                          │   │
│  │  - Embedding Generation                             │   │
│  │  - Similarity Search                                │   │
│  │  - LLM Integration                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Enhanced Prediction Service                        │   │
│  │  - Pattern Recognition                              │   │
│  │  - Context Augmentation                             │   │
│  │  - Confidence Scoring                               │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼──┐  ┌─────▼──┐  ┌─────▼──┐
   │Vector │  │  LLM   │  │Database│
   │Store  │  │ (OpenAI│  │(Postgres)
   │(Milvus)  │ or Local)  │        │
   └────────┘  └────────┘  └────────┘
```

## Implementation Steps

### Step 1: Add Dependencies to pom.xml

```xml
<!-- Vector Database -->
<dependency>
    <groupId>io.milvus</groupId>
    <artifactId>milvus-sdk-java</artifactId>
    <version>2.3.5</version>
</dependency>

<!-- Embedding Models -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>0.27.0</version>
</dependency>

<!-- LLM Integration -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
    <version>0.27.0</version>
</dependency>

<!-- JSON Processing -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

### Step 2: Create Vector Store Service

See `VectorStoreService.java` in this directory.

### Step 3: Create Embedding Service

See `EmbeddingService.java` in this directory.

### Step 4: Create RAG Service

See `RAGService.java` in this directory.

### Step 5: Create Training Data DTO

See `TrainingData.java` in this directory.

### Step 6: Create RAG Resource (REST API)

See `RAGResource.java` in this directory.

### Step 7: Update PredictionService

Integrate RAG context into existing predictions.

### Step 8: Frontend Integration

Add training data upload and RAG query UI components.

## Configuration

Add to `application.properties`:

```properties
# Vector Store (Milvus)
milvus.host=localhost
milvus.port=19530
milvus.collection.name=employee_patterns

# LLM Configuration
llm.provider=openai
llm.api.key=${OPENAI_API_KEY}
llm.model=gpt-4
llm.temperature=0.7

# Embedding Model
embedding.model=text-embedding-3-small
embedding.dimension=1536
```

## Usage Examples

### 1. Upload Training Data

```bash
curl -X POST http://localhost:8080/api/rag/train \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": 1,
    "leaveHistory": [...],
    "metadata": {...}
  }'
```

### 2. Get RAG-Enhanced Predictions

```bash
curl http://localhost:8080/api/rag/predict/store/2?days=30&topN=5
```

### 3. Query Similar Patterns

```bash
curl -X POST http://localhost:8080/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "employees who take leave in april",
    "limit": 5
  }'
```

## Data Flow

### Training Phase
1. Upload employee leave history
2. Generate embeddings for each employee pattern
3. Store embeddings in Milvus vector database
4. Index for fast similarity search

### Prediction Phase
1. Create query embedding from current employee context
2. Search vector store for similar employee patterns
3. Retrieve top-K similar cases
4. Augment prediction context with similar patterns
5. Use LLM to reason over context
6. Generate enhanced prediction with confidence score

## Vector Store Schema

```
Collection: employee_patterns
├── id (primary key)
├── employee_id
├── embedding (1536 dimensions)
├── leave_type
├── month
├── day_of_week
├── confidence_score
├── metadata (JSON)
└── created_at
```

## LLM Prompt Template

```
You are an expert in employee leave prediction. Given the following:

EMPLOYEE CONTEXT:
- Name: {employeeName}
- Role: {role}
- Location: {location}
- Leave History: {leaveHistory}

SIMILAR EMPLOYEE PATTERNS:
{similarPatterns}

PREDICTION SIGNALS:
- Month tendency: {monthTendency}
- Average gap: {avgGap} days
- Last leave: {daysSinceLast} days ago
- Upcoming holidays: {holidays}

Based on this context, predict:
1. Most likely leave date in next {windowDays} days
2. Leave type (CASUAL, SICK, EARNED)
3. Confidence score (0-1)
4. Reasoning

Respond in JSON format.
```

## Performance Optimization

### Caching Strategy
- Cache embeddings for frequently accessed employees
- Use Redis for LLM response caching
- Batch process embeddings for bulk uploads

### Vector Search Optimization
- Use IVF_FLAT index for Milvus
- Set appropriate nprobe for recall/speed tradeoff
- Partition by location for faster searches

### LLM Optimization
- Use function calling for structured outputs
- Implement request batching
- Cache system prompts

## Monitoring & Metrics

Track:
- Embedding generation latency
- Vector search latency
- LLM response time
- Prediction accuracy vs baseline
- Cache hit rates

## Troubleshooting

### Issue: Vector Store Connection Failed
```
Solution: Ensure Milvus is running
docker run -d --name milvus -p 19530:19530 milvusdb/milvus:latest
```

### Issue: Embedding Dimension Mismatch
```
Solution: Verify embedding model dimension matches collection schema
```

### Issue: LLM Rate Limiting
```
Solution: Implement exponential backoff and request queuing
```

## Next Steps

1. Set up Milvus vector database
2. Implement VectorStoreService
3. Add LLM integration
4. Create training data pipeline
5. Build frontend upload UI
6. Test with sample data
7. Monitor and optimize performance
8. Deploy to production

## References

- [LangChain4j Documentation](https://docs.langchain4j.dev/)
- [Milvus Documentation](https://milvus.io/docs)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [RAG Best Practices](https://docs.llamaindex.ai/en/stable/module_guides/querying/retrieval/)
