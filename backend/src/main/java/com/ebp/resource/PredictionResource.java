package com.ebp.resource;

import com.ebp.dto.PredictedLeave;
import com.ebp.dto.StorePrediction;
import com.ebp.service.PredictionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/predictions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PredictionResource {

    @Inject PredictionService predictionService;

    /**
     * Predict top N employees likely to take leave in a store
     * within the next `days` days.
     * GET /api/predictions/store/1?days=30&topN=5
     */
    @GET
    @Path("/store/{locationId}")
    public StorePrediction predictStore(
            @PathParam("locationId") Long locationId,
            @QueryParam("days") @DefaultValue("30") int days,
            @QueryParam("topN") @DefaultValue("5")  int topN) {
        return predictionService.predictForStore(locationId, days, topN);
    }

    /**
     * Predict next leave for a specific employee
     * GET /api/predictions/employee/42?days=60
     */
    @GET
    @Path("/employee/{employeeId}")
    public List<PredictedLeave> predictEmployee(
            @PathParam("employeeId") Long employeeId,
            @QueryParam("days") @DefaultValue("60") int days) {
        return predictionService.predictForEmployee(employeeId, days);
    }
}
