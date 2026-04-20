package com.ebp.dto;

import java.time.LocalDate;
import java.util.List;

public class ReplacementRecommendation {
    public Long   atRiskEmployeeId;
    public String atRiskEmployeeName;
    public String role;
    public Long   primaryStoreId;
    public String primaryStoreName;
    public Long   secondaryStoreId;    // null if unmapped
    public String secondaryStoreName;  // null if unmapped
    public LocalDate predictedLeaveDate;
    public double    leaveRisk;
    public String    riskReason;
    public String    mappingStatus;    // VALID | MISSING_SECONDARY | INVALID
    public List<ReplacementCandidate> candidates;

    public ReplacementRecommendation(Long atRiskEmployeeId, String atRiskEmployeeName,
                                     String role, Long primaryStoreId, String primaryStoreName,
                                     Long secondaryStoreId, String secondaryStoreName,
                                     LocalDate predictedLeaveDate, double leaveRisk,
                                     String riskReason, String mappingStatus,
                                     List<ReplacementCandidate> candidates) {
        this.atRiskEmployeeId   = atRiskEmployeeId;
        this.atRiskEmployeeName = atRiskEmployeeName;
        this.role               = role;
        this.primaryStoreId     = primaryStoreId;
        this.primaryStoreName   = primaryStoreName;
        this.secondaryStoreId   = secondaryStoreId;
        this.secondaryStoreName = secondaryStoreName;
        this.predictedLeaveDate = predictedLeaveDate;
        this.leaveRisk          = leaveRisk;
        this.riskReason         = riskReason;
        this.mappingStatus      = mappingStatus;
        this.candidates         = candidates;
    }
}
