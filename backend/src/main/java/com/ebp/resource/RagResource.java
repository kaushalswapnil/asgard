package com.ebp.resource;

import com.ebp.service.MilvusService;
import com.ebp.service.RagService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Path("/api/rag")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RagResource {

    private static final Logger log = Logger.getLogger(RagResource.class);

    @Inject RagService    ragService;
    @Inject MilvusService milvusService;

    // ── Request / Response DTOs ──────────────────────────────────────────────

    public static class TrainRequest {
        public Long employeeId;
    }

    public static class BatchTrainRequest {
        public List<Long> employeeIds;
    }

    public static class TrainResponse {
        public Long   employeeId;
        public String context;
        public TrainResponse(Long id, String ctx) { this.employeeId = id; this.context = ctx; }
    }

    public static class BatchTrainResponse {
        public int        trained_count;
        public List<Long> failed;
        public BatchTrainResponse(int count, List<Long> failed) {
            this.trained_count = count;
            this.failed        = failed;
        }
    }

    public static class StatsResponse {
        public long   total_embeddings;
        public String collection_name;
        public String milvus_host;
        public int    milvus_port;
        public boolean connected;
        public StatsResponse(long total, String col, String host, int port, boolean conn) {
            this.total_embeddings = total;
            this.collection_name  = col;
            this.milvus_host      = host;
            this.milvus_port      = port;
            this.connected        = conn;
        }
    }

    // ── Endpoints ────────────────────────────────────────────────────────────

    /**
     * POST /api/rag/train
     * Body: { "employeeId": 42 }
     * Builds the leave-pattern context, embeds it, and upserts it into Milvus.
     */
    @POST
    @Path("/train")
    public Response trainSingle(TrainRequest req) {
        if (req == null || req.employeeId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "employeeId is required")).build();
        }
        if (!milvusService.isConnected()) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(Map.of("error", "Milvus is not connected — RAG training unavailable.")).build();
        }
        try {
            String context = ragService.trainEmployee(req.employeeId);
            return Response.ok(new TrainResponse(req.employeeId, context)).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage())).build();
        } catch (Exception e) {
            log.errorf(e, "Failed to train employee %d", req.employeeId);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage())).build();
        }
    }

    /**
     * POST /api/rag/train/batch
     * Body: { "employeeIds": [1, 2, 3] }
     * Trains each employee; collects failures without aborting the whole batch.
     */
    @POST
    @Path("/train/batch")
    public Response trainBatch(BatchTrainRequest req) {
        if (req == null || req.employeeIds == null || req.employeeIds.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "employeeIds list is required")).build();
        }
        if (!milvusService.isConnected()) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(Map.of("error", "Milvus is not connected — RAG training unavailable.")).build();
        }

        int trained = 0;
        List<Long> failed = new ArrayList<>();

        for (Long empId : req.employeeIds) {
            try {
                ragService.trainEmployee(empId);
                trained++;
            } catch (Exception e) {
                log.warnf("Batch training skipped employee %d: %s", empId, e.getMessage());
                failed.add(empId);
            }
        }

        return Response.ok(new BatchTrainResponse(trained, failed)).build();
    }

    /**
     * GET /api/rag/stats
     * Returns current Milvus collection statistics.
     */
    @GET
    @Path("/stats")
    public Response stats() {
        boolean conn  = milvusService.isConnected();
        long    total = conn ? milvusService.count() : 0L;
        return Response.ok(new StatsResponse(
                total,
                milvusService.getCollectionName(),
                milvusService.getHost(),
                milvusService.getPort(),
                conn
        )).build();
    }

    /**
     * DELETE /api/rag/clear
     * Drops and recreates the Milvus collection — wipes all stored embeddings.
     */
    @DELETE
    @Path("/clear")
    public Response clear() {
        if (!milvusService.isConnected()) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(Map.of("error", "Milvus is not connected.")).build();
        }
        try {
            milvusService.clear();
            return Response.ok(Map.of("message", "All embeddings cleared successfully.")).build();
        } catch (Exception e) {
            log.errorf(e, "Failed to clear Milvus collection");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage())).build();
        }
    }
}
