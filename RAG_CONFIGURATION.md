# RAG Configuration for EBP

## Add to application.properties

```properties
# ============================================
# Vector Store Configuration (Milvus)
# ============================================
milvus.host=localhost
milvus.port=19530
milvus.collection.name=employee_patterns
milvus.index.type=IVF_FLAT
milvus.nprobe=10

# ============================================
# Embedding Configuration
# ============================================
embedding.model=text-embedding-3-small
embedding.dimension=1536
embedding.batch.size=32

# ============================================
# LLM Configuration
# ============================================
llm.provider=openai
llm.api.key=${OPENAI_API_KEY}
llm.model=gpt-4
llm.temperature=0.7
llm.max.tokens=500
llm.timeout.seconds=30

# ============================================
# RAG Configuration
# ============================================
rag.enabled=true
rag.similarity.threshold=0.5
rag.top.k=3
rag.cache.enabled=true
rag.cache.ttl.minutes=60

# ============================================
# Performance Tuning
# ============================================
rag.batch.training.size=100
rag.embedding.cache.size=10000
rag.search.timeout.ms=5000
```

## Environment Variables

```bash
# Required for OpenAI integration
export OPENAI_API_KEY=sk-...

# Optional: Milvus connection
export MILVUS_HOST=localhost
export MILVUS_PORT=19530
```

## Docker Compose for Milvus

Add to docker-compose.yml:

```yaml
milvus:
  image: milvusdb/milvus:latest
  container_name: milvus-standalone
  ports:
    - "19530:19530"
    - "9091:9091"
  environment:
    COMMON_STORAGETYPE: local
  volumes:
    - milvus_data:/var/lib/milvus
  networks:
    - ebp-network

volumes:
  milvus_data:

networks:
  ebp-network:
    driver: bridge
```

## Quick Start

### 1. Start Milvus

```bash
docker run -d --name milvus \
  -p 19530:19530 \
  -p 9091:9091 \
  milvusdb/milvus:latest
```

### 2. Train RAG Model

```bash
# Train single employee
curl -X POST http://localhost:8080/api/rag/train \
  -H "Content-Type: application/json" \
  -d '{"employeeId": 1}'

# Train all employees
curl -X POST http://localhost:8080/api/rag/train/batch \
  -H "Content-Type: application/json" \
  -d '{"employeeIds": [1, 2, 3, 4, 5]}'
```

### 3. Get RAG-Enhanced Predictions

```bash
curl http://localhost:8080/api/rag/predict/employee/1?days=30
```

### 4. Search Similar Patterns

```bash
curl -X POST http://localhost:8080/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "employeeName": "John Doe",
    "role": "Cashier",
    "location": "Store London Oxford St",
    "limit": 5
  }'
```

### 5. Check Stats

```bash
curl http://localhost:8080/api/rag/stats
```

## Integration with Existing Prediction API

The RAG service can be integrated into the existing prediction endpoints:

```bash
# Enhanced store predictions with RAG
curl http://localhost:8080/api/predictions/store/2?days=30&topN=5&useRAG=true
```

## Monitoring

### Check Milvus Health

```bash
curl http://localhost:9091/healthz
```

### View Embeddings

```bash
# Get vector store stats
curl http://localhost:8080/api/rag/stats
```

## Troubleshooting

### Milvus Connection Failed

```bash
# Check if Milvus is running
docker ps | grep milvus

# View logs
docker logs milvus-standalone

# Restart
docker restart milvus-standalone
```

### Embedding Generation Failed

- Ensure OPENAI_API_KEY is set
- Check API key validity
- Verify network connectivity to OpenAI

### Vector Search Slow

- Increase nprobe in configuration
- Reduce top.k value
- Add indexing to Milvus collection

## Performance Metrics

Track these metrics:

- **Embedding Generation Time**: < 100ms per embedding
- **Vector Search Time**: < 50ms for top-10 search
- **LLM Response Time**: < 2s per prediction
- **Cache Hit Rate**: > 80% for repeated queries
- **Prediction Accuracy**: Compare with baseline model

## Next Steps

1. ✅ Set up Milvus vector database
2. ✅ Implement EmbeddingService
3. ✅ Implement VectorStoreService
4. ✅ Implement RAGService
5. ✅ Create RAGResource endpoints
6. ⬜ Integrate with frontend
7. ⬜ Add LLM integration (OpenAI/Local)
8. ⬜ Implement caching layer
9. ⬜ Add monitoring and metrics
10. ⬜ Performance optimization
