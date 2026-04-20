package com.ebp.resource;

import com.ebp.dto.*;
import com.ebp.service.ReplacementService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/replacements")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReplacementResource {

    @Inject ReplacementService replacementService;

    /**
     * Steps 1-3: Get replacement recommendations for all high-risk employees in a store.
     * Employees with INVALID mapping (no primary store) are excluded.
     * GET /api/replacements/store/1?days=30
     */
    @GET
    @Path("/store/{locationId}")
    public List<ReplacementRecommendation> forStore(
            @PathParam("locationId") Long locationId,
            @QueryParam("days") @DefaultValue("30") int days) {
        return replacementService.getRecommendationsForStore(locationId, days);
    }

    /**
     * Steps 1-3: Get replacement recommendation for a single employee.
     * Returns 404 if employee has INVALID mapping or no high-risk prediction.
     * GET /api/replacements/employee/42?days=30
     */
    @GET
    @Path("/employee/{employeeId}")
    public Response forEmployee(
            @PathParam("employeeId") Long employeeId,
            @QueryParam("days") @DefaultValue("30") int days) {
        return replacementService.getRecommendationForEmployee(employeeId, days)
                .map(r -> Response.ok(r).build())
                .orElse(Response.status(Response.Status.NOT_FOUND)
                        .entity("{\"error\":\"No recommendation available — mapping invalid or risk below threshold\"}")
                        .build());
    }

    /**
     * Step 4: Manager approves or overrides a suggested swap.
     * POST /api/replacements/action
     * Body: { atRiskEmployeeId, selectedReplacementId, action, managerNote }
     */
    @POST
    @Path("/action")
    public SwapActionResponse action(SwapActionRequest req) {
        return replacementService.processSwapAction(req);
    }
}
