package com.ebp.service;

import io.milvus.client.MilvusServiceClient;
import io.milvus.param.MetricType;
import io.milvus.grpc.DataType;
import io.milvus.grpc.GetCollectionStatisticsResponse;
import io.milvus.grpc.MutationResult;
import io.milvus.grpc.SearchResults;
import io.milvus.param.ConnectParam;
import io.milvus.param.IndexType;
import io.milvus.param.R;
import io.milvus.param.RpcStatus;
import io.milvus.param.collection.*;
import io.milvus.param.dml.*;
import io.milvus.param.index.CreateIndexParam;
import io.milvus.response.SearchResultsWrapper;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Wraps the Milvus SDK client.
 * Handles collection lifecycle, vector insertion, similarity search, and stats.
 * Degrades gracefully when Milvus is not running — callers check isConnected().
 */
@ApplicationScoped
public class MilvusService {

    private static final Logger log = Logger.getLogger(MilvusService.class);

    @ConfigProperty(name = "milvus.host",            defaultValue = "localhost")
    String host;

    @ConfigProperty(name = "milvus.port",            defaultValue = "19530")
    int port;

    @ConfigProperty(name = "milvus.collection.name", defaultValue = "employee_patterns")
    String collectionName;

    @ConfigProperty(name = "embedding.dimension",    defaultValue = "1536")
    int dimension;

    @ConfigProperty(name = "rag.enabled",            defaultValue = "true")
    boolean ragEnabled;

    private MilvusServiceClient client;
    private volatile boolean connected = false;

    // ── Lifecycle ────────────────────────────────────────────────────────────

    @PostConstruct
    void init() {
        if (!ragEnabled) {
            log.info("RAG disabled via rag.enabled=false — Milvus skipped.");
            return;
        }
        try {
            ConnectParam connectParam = ConnectParam.newBuilder()
                    .withHost(host)
                    .withPort(port)
                    .withConnectTimeout(5, TimeUnit.SECONDS)
                    .withKeepAliveTime(55, TimeUnit.SECONDS)
                    .withKeepAliveTimeout(20, TimeUnit.SECONDS)
                    .build();
            client = new MilvusServiceClient(connectParam);

            // Verify the connection is live with a real call
            R<Boolean> probe = client.hasCollection(
                    HasCollectionParam.newBuilder().withCollectionName(collectionName).build());
            if (probe.getException() != null) throw probe.getException();

            ensureCollection();
            connected = true;
            log.infof("Milvus ready at %s:%d  collection='%s'", host, port, collectionName);
        } catch (Exception e) {
            log.warnf("Milvus not available (%s). RAG features will be disabled.", e.getMessage());
        }
    }

    // ── Collection management ────────────────────────────────────────────────

    private void ensureCollection() {
        R<Boolean> has = client.hasCollection(
                HasCollectionParam.newBuilder().withCollectionName(collectionName).build());

        if (Boolean.FALSE.equals(has.getData())) {
            createCollection();
            createIndex();
        }
        // Load the collection into memory so searches work immediately
        client.loadCollection(LoadCollectionParam.newBuilder()
                .withCollectionName(collectionName).build());
    }

    private void createCollection() {
        List<FieldType> fields = List.of(
                FieldType.newBuilder()
                        .withName("id").withDataType(DataType.Int64)
                        .withPrimaryKey(true).withAutoID(true).build(),
                FieldType.newBuilder()
                        .withName("employee_id").withDataType(DataType.Int64).build(),
                FieldType.newBuilder()
                        .withName("embedding").withDataType(DataType.FloatVector)
                        .withDimension(dimension).build(),
                FieldType.newBuilder()
                        .withName("content").withDataType(DataType.VarChar)
                        .withMaxLength(65_535).build()
        );

        R<RpcStatus> r = client.createCollection(
                CreateCollectionParam.newBuilder()
                        .withCollectionName(collectionName)
                        .withDescription("Employee leave pattern embeddings for RAG")
                        .withFieldTypes(fields)
                        .build());
        checkOk(r, "createCollection");
        log.infof("Created Milvus collection '%s'", collectionName);
    }

    private void createIndex() {
        R<RpcStatus> r = client.createIndex(
                CreateIndexParam.newBuilder()
                        .withCollectionName(collectionName)
                        .withFieldName("embedding")
                        .withIndexType(IndexType.IVF_FLAT)
                        .withMetricType(MetricType.COSINE)
                        .withExtraParam("{\"nlist\":128}")
                        .build());
        checkOk(r, "createIndex");
        log.infof("Created IVF_FLAT/COSINE index on '%s'", collectionName);
    }

    // ── Write operations ─────────────────────────────────────────────────────

    /**
     * Upserts an employee's embedding — deletes the old one first so each
     * employee has exactly one vector in the collection at all times.
     */
    public void upsert(Long employeeId, List<Float> embedding, String content) {
        requireConnected();

        // Delete any existing vector for this employee
        client.delete(DeleteParam.newBuilder()
                .withCollectionName(collectionName)
                .withExpr("employee_id == " + employeeId)
                .build());

        R<MutationResult> r = client.insert(InsertParam.newBuilder()
                .withCollectionName(collectionName)
                .withFields(List.of(
                        new InsertParam.Field("employee_id", List.of(employeeId)),
                        new InsertParam.Field("embedding",   List.of(embedding)),
                        new InsertParam.Field("content",     List.of(content))
                ))
                .build());
        checkOk(r, "insert");

        // Flush so the new vector is immediately searchable
        client.flush(FlushParam.newBuilder()
                .withCollectionNames(List.of(collectionName))
                .build());
    }

    // ── Read operations ──────────────────────────────────────────────────────

    /**
     * Returns the top-K most similar content strings for the given query vector.
     */
    public List<String> search(List<Float> queryVector, int topK) {
        requireConnected();

        R<SearchResults> r = client.search(SearchParam.newBuilder()
                .withCollectionName(collectionName)
                .withMetricType(MetricType.COSINE)
                .withVectors(List.of(queryVector))
                .withTopK(topK)
                .withVectorFieldName("embedding")
                .withOutFields(List.of("employee_id", "content"))
                .withParams("{\"nprobe\":10}")
                .build());
        checkOk(r, "search");

        SearchResultsWrapper wrapper = new SearchResultsWrapper(r.getData().getResults());
        List<?> raw = wrapper.getFieldData("content", 0);

        List<String> results = new ArrayList<>();
        if (raw != null) {
            for (Object obj : raw) {
                if (obj != null) results.add(obj.toString());
            }
        }
        return results;
    }

    /** Total number of vectors currently stored in the collection. */
    public long count() {
        if (!connected) return 0L;

        // Flush first to ensure pending inserts are counted
        client.flush(FlushParam.newBuilder()
                .withCollectionNames(List.of(collectionName)).build());

        R<GetCollectionStatisticsResponse> r = client.getCollectionStatistics(
                GetCollectionStatisticsParam.newBuilder()
                        .withCollectionName(collectionName)
                        .withFlush(true)
                        .build());
        if (r.getException() != null) return 0L;

        return r.getData().getStatsList().stream()
                .filter(kv -> "row_count".equals(kv.getKey()))
                .mapToLong(kv -> Long.parseLong(kv.getValue()))
                .findFirst()
                .orElse(0L);
    }

    /** Drops and recreates the collection — wipes all stored embeddings. */
    public void clear() {
        requireConnected();
        client.releaseCollection(ReleaseCollectionParam.newBuilder()
                .withCollectionName(collectionName).build());
        client.dropCollection(DropCollectionParam.newBuilder()
                .withCollectionName(collectionName).build());
        createCollection();
        createIndex();
        client.loadCollection(LoadCollectionParam.newBuilder()
                .withCollectionName(collectionName).build());
        log.infof("Milvus collection '%s' cleared and recreated.", collectionName);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public boolean isConnected() { return connected; }

    public String getHost()           { return host; }
    public int    getPort()           { return port; }
    public String getCollectionName() { return collectionName; }

    private void requireConnected() {
        if (!connected) throw new IllegalStateException("Milvus is not connected.");
    }

    private void checkOk(R<?> r, String op) {
        if (r.getException() != null)
            throw new RuntimeException("Milvus " + op + " failed: " + r.getException().getMessage(),
                    r.getException());
    }
}
