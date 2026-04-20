package com.ebp.service;

import com.ebp.dto.*;
import com.ebp.entity.Employee;
import com.ebp.entity.EmployeeLeave;
import com.ebp.repository.EmployeeLeaveRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class ReplacementService {

    @Inject PredictionService    predictionService;
    @Inject EmployeeLeaveRepository leaveRepo;

    private static final double HIGH_RISK_THRESHOLD = 0.55;
    private static final int    MAX_CANDIDATES      = 3;

    // ---------------------------------------------------------------
    // Step 1 + 2 + 3: For a store, find high-risk employees and
    // return ranked replacement recommendations.
    // Blocks downstream if mapping is INVALID (no primary store).
    // ---------------------------------------------------------------
    public List<ReplacementRecommendation> getRecommendationsForStore(Long locationId, int windowDays) {

        // Step 2: consume predictions from existing service (no modification)
        StorePrediction storePrediction = predictionService.predictForStore(locationId, windowDays, 50);

        List<ReplacementRecommendation> recommendations = new ArrayList<>();

        for (PredictedLeave prediction : storePrediction.predictions) {
            if (prediction.confidence < HIGH_RISK_THRESHOLD) continue;

            Employee atRisk = Employee.findById(prediction.employeeId);
            if (atRisk == null) continue;

            // Step 1: validate mapping
            String mappingStatus = validateMapping(atRisk);
            if ("INVALID".equals(mappingStatus)) continue; // block downstream

            // Step 3: find replacement candidates
            List<ReplacementCandidate> candidates = findCandidates(atRisk, prediction, windowDays);

            recommendations.add(new ReplacementRecommendation(
                    atRisk.id,
                    atRisk.name,
                    atRisk.role,
                    atRisk.location.id,
                    atRisk.location.name,
                    atRisk.secondaryLocation != null ? atRisk.secondaryLocation.id   : null,
                    atRisk.secondaryLocation != null ? atRisk.secondaryLocation.name : null,
                    prediction.predictedDate,
                    prediction.confidence,
                    prediction.reason,
                    mappingStatus,
                    candidates
            ));
        }

        return recommendations;
    }

    // ---------------------------------------------------------------
    // Single-employee recommendation (used by manager for one employee)
    // ---------------------------------------------------------------
    public Optional<ReplacementRecommendation> getRecommendationForEmployee(Long employeeId, int windowDays) {
        Employee atRisk = Employee.findById(employeeId);
        if (atRisk == null) return Optional.empty();

        String mappingStatus = validateMapping(atRisk);
        if ("INVALID".equals(mappingStatus)) return Optional.empty();

        List<PredictedLeave> predictions = predictionService.predictForEmployee(employeeId, windowDays);
        if (predictions.isEmpty()) return Optional.empty();

        PredictedLeave prediction = predictions.get(0);
        List<ReplacementCandidate> candidates = findCandidates(atRisk, prediction, windowDays);

        return Optional.of(new ReplacementRecommendation(
                atRisk.id,
                atRisk.name,
                atRisk.role,
                atRisk.location.id,
                atRisk.location.name,
                atRisk.secondaryLocation != null ? atRisk.secondaryLocation.id   : null,
                atRisk.secondaryLocation != null ? atRisk.secondaryLocation.name : null,
                prediction.predictedDate,
                prediction.confidence,
                prediction.reason,
                mappingStatus,
                candidates
        ));
    }

    // ---------------------------------------------------------------
    // Step 4: Manager approves or overrides a suggested swap
    // ---------------------------------------------------------------
    public SwapActionResponse processSwapAction(SwapActionRequest req) {
        Employee atRisk = Employee.findById(req.atRiskEmployeeId);
        if (atRisk == null)
            return new SwapActionResponse("ERROR", "At-risk employee not found",
                    req.atRiskEmployeeId, null, req.managerNote);

        if ("APPROVE".equals(req.action)) {
            if (req.selectedReplacementId == null)
                return new SwapActionResponse("ERROR", "No replacement selected for APPROVE action",
                        req.atRiskEmployeeId, null, req.managerNote);

            Employee replacement = Employee.findById(req.selectedReplacementId);
            if (replacement == null)
                return new SwapActionResponse("ERROR", "Replacement employee not found",
                        req.atRiskEmployeeId, req.selectedReplacementId, req.managerNote);

            return new SwapActionResponse(
                    "APPROVED",
                    String.format("Swap approved: %s will cover for %s", replacement.name, atRisk.name),
                    atRisk.id,
                    replacement.id,
                    req.managerNote
            );
        }

        // OVERRIDE — manager will handle manually
        return new SwapActionResponse(
                "OVERRIDDEN",
                String.format("Manager override recorded for %s. Manual arrangement required.", atRisk.name),
                atRisk.id,
                req.selectedReplacementId,
                req.managerNote
        );
    }

    // ---------------------------------------------------------------
    // Step 1: Validate employee store mapping
    // VALID            — has primary store (secondary optional)
    // MISSING_SECONDARY — primary present, no secondary
    // INVALID          — no primary store (blocks downstream)
    // ---------------------------------------------------------------
    private String validateMapping(Employee emp) {
        if (emp.location == null) return "INVALID";
        if (emp.secondaryLocation == null) return "MISSING_SECONDARY";
        return "VALID";
    }

    // ---------------------------------------------------------------
    // Step 3: Find up to MAX_CANDIDATES replacements for an at-risk employee.
    // Candidate pool = same primary store + employees whose secondary
    // store matches the at-risk employee's primary store.
    // Filters: same role, active, lower leave risk, not on leave in window.
    // ---------------------------------------------------------------
    private List<ReplacementCandidate> findCandidates(Employee atRisk,
                                                       PredictedLeave prediction,
                                                       int windowDays) {
        LocalDate windowStart = LocalDate.now();
        LocalDate windowEnd   = windowStart.plusDays(windowDays);

        // Pool: same-store active employees with matching role
        List<Employee> sameStore = Employee.list(
                "location.id = ?1 and isActive = true and id != ?2 and role = ?3",
                atRisk.location.id, atRisk.id, atRisk.role);

        // Also include employees whose secondary store matches at-risk's primary
        List<Employee> secondaryPool = Employee.list(
                "secondaryLocation.id = ?1 and isActive = true and id != ?2 and role = ?3",
                atRisk.location.id, atRisk.id, atRisk.role);

        // Merge, deduplicate
        Map<Long, Employee> poolMap = new LinkedHashMap<>();
        sameStore.forEach(e -> poolMap.put(e.id, e));
        secondaryPool.forEach(e -> poolMap.putIfAbsent(e.id, e));

        List<ReplacementCandidate> candidates = new ArrayList<>();

        for (Employee candidate : poolMap.values()) {
            // Filter: not already on leave in the prediction window
            List<EmployeeLeave> windowLeaves = leaveRepo.findApprovedByEmployee(candidate.id)
                    .stream()
                    .filter(l -> !l.leaveDate.isBefore(windowStart) && !l.leaveDate.isAfter(windowEnd))
                    .toList();
            if (!windowLeaves.isEmpty()) continue;

            // Compute candidate's own leave risk (reuse prediction service)
            List<PredictedLeave> candidatePredictions =
                    predictionService.predictForEmployee(candidate.id, windowDays);
            double candidateRisk = candidatePredictions.isEmpty()
                    ? 0.0
                    : candidatePredictions.get(0).confidence;

            // Only surface candidates with lower risk than the at-risk employee
            if (candidateRisk >= prediction.confidence) continue;

            // Recent leave count (last 90 days) as availability signal
            LocalDate ninetyDaysAgo = LocalDate.now().minusDays(90);
            int recentLeaves = (int) leaveRepo.findApprovedByEmployee(candidate.id)
                    .stream()
                    .filter(l -> l.leaveDate.isAfter(ninetyDaysAgo))
                    .count();

            String alignment = sameStore.stream().anyMatch(e -> e.id.equals(candidate.id))
                    ? "PRIMARY" : "SECONDARY";

            String matchReason = buildMatchReason(candidate, alignment, candidateRisk, recentLeaves);

            candidates.add(new ReplacementCandidate(
                    candidate.id,
                    candidate.name,
                    candidate.role,
                    alignment,
                    Math.round(candidateRisk * 100.0) / 100.0,
                    recentLeaves,
                    matchReason
            ));
        }

        // Sort: primary alignment first, then by ascending leave risk
        candidates.sort(Comparator
                .comparing((ReplacementCandidate c) -> c.storeAlignment.equals("PRIMARY") ? 0 : 1)
                .thenComparingDouble(c -> c.leaveRisk));

        return candidates.stream().limit(MAX_CANDIDATES).collect(Collectors.toList());
    }

    private String buildMatchReason(Employee candidate, String alignment,
                                    double risk, int recentLeaves) {
        List<String> parts = new ArrayList<>();
        parts.add(alignment.equals("PRIMARY") ? "same store" : "secondary store match");
        parts.add("role match: " + candidate.role);
        if (risk == 0.0) parts.add("no predicted leave");
        else parts.add(String.format("risk %.0f%%", risk * 100));
        if (recentLeaves == 0) parts.add("no recent leave");
        return String.join(", ", parts);
    }
}
